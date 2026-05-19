package com.autocita.backend.reassignmentLog;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.appointment.AppointmentRepository;
import com.autocita.backend.appointment.AppointmentService;
import com.autocita.backend.appointment.AppointmentStatus;
import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.email.EmailResponseToken;
import com.autocita.backend.email.EmailResponseTokenRepository;
import com.autocita.backend.email.EmailService;
import com.autocita.backend.waitingList.TimePreference;
import com.autocita.backend.waitingList.WaitingList;
import com.autocita.backend.waitingList.WaitingListRepository;
import com.autocita.backend.patient.Patient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReassignmentService {

    @Autowired
    private WaitingListRepository waitingListRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private ReassignmentLogRepository reassignmentLogRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private EmailResponseTokenRepository emailTokenRepository;

    @Transactional
    public void procesarReasignacion(Appointment hueco, Patient pacienteOriginal) {
        // VALIDACIÓN: Verificar que el hueco está dentro del turno actual del médico
        if (!AppointmentService.isWithinDoctorShift(hueco.getStartTime(), hueco.getDoctor().getWorkShift())) {
            dejarHuecoLibre(hueco, pacienteOriginal);
            return;
        }

        LocalDate fechaHueco = hueco.getStartTime().toLocalDate();

        // INTENTO 1: Buscar candidatos para el MISMO DÍA del hueco (turno exacto O ANY)
        Optional<WaitingList> ganador = buscarCandidatos(hueco, pacienteOriginal, fechaHueco, "EXACT_OR_ANY");

        if (ganador.isPresent()) {
            ofrecerHueco(hueco, ganador.get().getPatient(), pacienteOriginal);
            return;
        }

        // INTENTO 2: Si no hay candidatos el mismo día, buscar para el DÍA SIGUIENTE
        // (turno exacto O ANY)
        LocalDate fechaSiguiente = fechaHueco.plusDays(1);
        ganador = buscarCandidatos(hueco, pacienteOriginal, fechaSiguiente, "EXACT_OR_ANY");

        if (ganador.isPresent()) {
            ofrecerHueco(hueco, ganador.get().getPatient(), pacienteOriginal);
            return;
        }

        // INTENTO 3: Si no hay candidatos, buscar MISMO DÍA con turno CONTRARIO
        // Solo si el turno contrario aún no ha pasado (es futuro)
        if (turnoContrarioAunNoHaPasado(hueco.getStartTime())) {
            ganador = buscarCandidatos(hueco, pacienteOriginal, fechaHueco, "OPPOSITE");

            if (ganador.isPresent()) {
                ofrecerHueco(hueco, ganador.get().getPatient(), pacienteOriginal);
                return;
            }
        }

        // INTENTO 4: Si no hay candidatos con turno contrario, buscar DÍA SIGUIENTE con
        // turno CONTRARIO
        // Siempre se ofrece el turno contrario del día siguiente (es futuro)
        ganador = buscarCandidatos(hueco, pacienteOriginal, fechaSiguiente, "OPPOSITE");

        if (ganador.isPresent()) {
            ofrecerHueco(hueco, ganador.get().getPatient(), pacienteOriginal);
            return;
        }

        // INTENTO 5: Sin candidatos nuevos → intentar segunda vuelta con los que no respondieron
        System.out.println("ℹ Sin candidatos nuevos para el hueco del " + fechaHueco +
                " ni para el " + fechaSiguiente + ". Comprobando lista de no respondidos...");
        List<com.autocita.backend.patient.Patient> candidatosR2 = buscarCandidatosNoRespondidos(hueco);
        if (!candidatosR2.isEmpty()) {
            System.out.println("🔄 Segunda vuelta: " + candidatosR2.size() + " candidato(s) que no respondieron en primera ronda.");
            procesarSegundaVuelta(hueco, pacienteOriginal);
            return;
        }

        System.out.println("ℹ Sin candidatos en ninguna vuelta. Dejando hueco libre.");
        dejarHuecoLibre(hueco, pacienteOriginal);
    }

    /**
     * Devuelve los candidatos que no respondieron en primera ronda y que todavía
     * no han sido intentados (ni descartados) en segunda vuelta, en el mismo orden
     * en que el algoritmo los encontró originalmente.
     */
    private List<com.autocita.backend.patient.Patient> buscarCandidatosNoRespondidos(Appointment hueco) {
        List<com.autocita.backend.patient.Patient> noRespondieron =
                reassignmentLogRepository.findNotRespondedPatientsOrdered(hueco.getId());
        List<Integer> yaDescartadosR2 =
                reassignmentLogRepository.findSecondRoundExcludedIds(hueco.getId());

        return noRespondieron.stream()
                .filter(p -> !yaDescartadosR2.contains(p.getId()))
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Segunda vuelta: ofrece el hueco en orden a los candidatos que no respondieron
     * en la primera ronda. Si todos rechazan o no responden de nuevo, el hueco
     * queda libre definitivamente.
     */
    @Transactional
    public void procesarSegundaVuelta(Appointment hueco, Patient original) {
        List<com.autocita.backend.patient.Patient> candidatosR2 = buscarCandidatosNoRespondidos(hueco);

        if (candidatosR2.isEmpty()) {
            System.out.println("ℹ Segunda vuelta agotada. Dejando hueco libre definitivamente.");
            dejarHuecoLibre(hueco, original);
            return;
        }

        com.autocita.backend.patient.Patient candidato = candidatosR2.get(0);
        System.out.println("🔄 Segunda vuelta: ofreciendo a " + candidato.getEmail()
                + " (" + (candidatosR2.size() - 1) + " candidato(s) pendientes tras este)");
        ofrecerHueco(hueco, candidato, original, true);
    }

    private Optional<WaitingList> buscarCandidatos(Appointment hueco, Patient pacienteOriginal,
            LocalDate fechaBusqueda, String tipoFiltroTurno) {
        // Pacientes que ya rechazaron esta cita
        List<Integer> excluidos = reassignmentLogRepository.findRejectedPatientIdsByAppointment(hueco.getId());

        // Obtener candidatos de la lista de espera para esa especialidad
        List<WaitingList> candidatos = waitingListRepository.findBySpecialty(hueco.getDoctor().getSpecialty());

        Optional<WaitingList> ganador = candidatos.stream()
                // Filtro 1: Solo ACTIVE (no expirados, rechazados, etc.)
                .filter(c -> c.getStatus() == com.autocita.backend.waitingList.WaitingListStatus.ACTIVE)

                // Filtro 2: No estar en la lista de excluidos (reemplazo sucesivo)
                .filter(c -> !excluidos.contains(c.getPatient().getId()))

                // Filtro 3: No tener cita exactamente a la misma hora
                .filter(c -> !appointmentRepository.existsActiveByPatientIdAndStartTime(c.getPatient().getId(),
                        hueco.getStartTime()))

                // Filtro 4: Validar citas el mismo día
                // Si tiene cita ese día: solo si es de DIFERENTE especialidad y la hora del
                // hueco es ANTERIOR
                .filter(c -> puedeAceptarCitaAlMismoDia(c.getPatient(), hueco, fechaBusqueda))

                // Filtro 5: Máximo 2 citas por día y sin solapamiento de horarios
                .filter(c -> puedeAsignarSegundaCitaDifEspecialidad(c.getPatient(), hueco, fechaBusqueda))

                // Filtro 6: Filtro de turno según tipo
                .filter(c -> filtrarPorTurno(c.getTimePreference(), hueco.getStartTime(), tipoFiltroTurno))

                // Filtro 7: Solo candidatos con fecha preferida EXACTAMENTE igual a la fecha buscada
                // (mismo día del hueco o día siguiente, nunca días anteriores)
                .filter(c -> c.getPreferredDate().equals(fechaBusqueda))

                // ORDENACIÓN DE PRIORIDAD
                .sorted(Comparator
                        // 1º MÁXIMA PRIORIDAD: ¿Es la fecha EXACTA del hueco? (coincidencia = máxima
                        // prioridad)
                        .comparing((WaitingList w) -> w.getPreferredDate().equals(fechaBusqueda),
                                Comparator.reverseOrder())

                        // 2º: Urgencia (HIGH -> MEDIUM -> LOW) - ANTES QUE CITAS PREVIAS
                        .thenComparing((WaitingList w) -> w.getUrgency().getPriorityValue(),
                                Comparator.reverseOrder())

                        // 3º: ¿Tiene cita ese día? (SIN cita gana sobre CON cita)
                        .thenComparing((WaitingList w) -> tieneCitaEseDia(w.getPatient(), fechaBusqueda))

                        // 4º: Antigüedad en la lista (First come, first served) - DESEMPATE FINAL
                        .thenComparing(WaitingList::getRequestDate))

                .findFirst();

        return ganador;
    }

    /**
     * Verifica si el turno contrario aún no ha pasado en el mismo día
     * - Si hueco es MAÑANA → TARDE siempre es futuro (true)
     * - Si hueco es TARDE → MAÑANA solo es futuro si aún no hemos alcanzado las
     * 14:00 (true)
     */
    private boolean turnoContrarioAunNoHaPasado(LocalDateTime horaCita) {
        int horaDelHueco = horaCita.getHour();
        int horaActual = LocalDateTime.now().getHour();

        // Si el hueco es MAÑANA (< 14:00), el turno contrario (TARDE) siempre es futuro
        if (horaDelHueco < 14) {
            return true;
        }

        // Si el hueco es TARDE (>= 14:00), el turno contrario (MAÑANA) es futuro solo
        // si aún no pasó las 14:00
        return horaActual < 14;
    }

    private boolean filtrarPorTurno(TimePreference preferenciaPersona, LocalDateTime horaCita, String tipoFiltroTurno) {
        int hora = horaCita.getHour();
        boolean esManana = hora < 14; // Corte a las 14:00

        if (tipoFiltroTurno.equals("EXACT_OR_ANY")) {
            // Aceptar turno exacto O ambos (ANY)
            if (preferenciaPersona == TimePreference.ANY) {
                return true;
            }
            if (preferenciaPersona == TimePreference.MORNING && esManana) {
                return true;
            }
            if (preferenciaPersona == TimePreference.AFTERNOON && !esManana) {
                return true;
            }
            return false;
        } else if (tipoFiltroTurno.equals("OPPOSITE")) {
            // Aceptar SOLO turno contrario (no ANY)
            if (preferenciaPersona == TimePreference.ANY) {
                return false; // Excluir los que eligieron "ambos"
            }
            if (preferenciaPersona == TimePreference.MORNING && !esManana) {
                return true; // Persona quería mañana, hueco es tarde
            }
            if (preferenciaPersona == TimePreference.AFTERNOON && esManana) {
                return true; // Persona quería tarde, hueco es mañana
            }
            return false;
        }

        return false;
    }

    private void ofrecerHueco(Appointment hueco, Patient candidato, Patient original) {
        ofrecerHueco(hueco, candidato, original, false);
    }

    public boolean isSecondRound(Integer appointmentId) {
        return reassignmentLogRepository.existsByAppointmentIdAndReason(appointmentId, "OFERTA_ENVIADA_R2");
    }

    private void ofrecerHueco(Appointment hueco, Patient candidato, Patient original, boolean segundaVuelta) {
        hueco.setPatient(candidato);
        hueco.setStatus(AppointmentStatus.OFFERED);
        hueco.setOfferedAt(LocalDateTime.now(ZoneId.of("Europe/Madrid")));
        appointmentRepository.save(hueco);

        guardarLog(hueco, original, candidato, segundaVuelta ? "OFERTA_ENVIADA_R2" : "OFERTA_ENVIADA");

        // Actualizar status de la lista de espera a OFFERED.
        // En primera vuelta buscamos entradas ACTIVE; en segunda vuelta la entrada
        // puede estar ya en REJECTED (por no haber respondido antes), así que la
        // reabrimos a OFFERED para que el paciente pueda ver y responder desde la app.
        List<WaitingList> registros = waitingListRepository.findByPatientId(candidato.getId());
        for (WaitingList w : registros) {
            boolean elegible = segundaVuelta
                    ? w.getStatus() == com.autocita.backend.waitingList.WaitingListStatus.NOT_RESPONDED
                    : w.getStatus() == com.autocita.backend.waitingList.WaitingListStatus.ACTIVE;
            if (elegible && w.getSpecialty() == hueco.getDoctor().getSpecialty()) {
                w.setStatus(com.autocita.backend.waitingList.WaitingListStatus.OFFERED);
                waitingListRepository.save(w);
                break;
            }
        }

        enviarNotificacionPorEmail(hueco, candidato);
    }

    // Envía notificación por email con opción de aceptar/rechazar desde el email
    private void enviarNotificacionPorEmail(Appointment hueco, Patient paciente) {
        try {
            // Generar tokens únicos para aceptar y rechazar
            String acceptToken = UUID.randomUUID().toString();
            String rejectToken = UUID.randomUUID().toString();

            // Guardar tokens en la BD con expiración de 15 minutos
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

            EmailResponseToken acceptTokenObj = new EmailResponseToken(acceptToken, hueco, paciente, expiresAt);
            EmailResponseToken rejectTokenObj = new EmailResponseToken(rejectToken, hueco, paciente, expiresAt);

            emailTokenRepository.save(acceptTokenObj);
            emailTokenRepository.save(rejectTokenObj);

            // Enviar email
            boolean emailSent = emailService.sendReassignmentNotification(paciente, hueco, acceptToken, rejectToken);

            if (!emailSent) {
                System.out.println("No se pudo enviar email a " + paciente.getEmail() +
                        ". El paciente deberá responder desde la plataforma.");
            }
        } catch (Exception e) {
            System.out.println("Error procesando respuesta por email: " + e.getMessage());
        }
    }

    private void dejarHuecoLibre(Appointment hueco, Patient original) {
        hueco.setPatient(null);
        hueco.setStatus(AppointmentStatus.AVAILABLE);
        appointmentRepository.save(hueco);
        guardarLog(hueco, original, null, "SIN_CANDIDATOS_DISPONIBLES");
    }

    // Verifica si un paciente tiene ALGUNA cita ese día
    private boolean tieneCitaEseDia(Patient paciente, LocalDate fecha) {
        List<Appointment> citas = appointmentRepository.findPatientAppointmentsByDate(paciente.getId(), fecha);
        return !citas.isEmpty();
    }

    // Valida si un paciente puede aceptar una cita el mismo día que ya tiene otra
    // cita.
    private boolean puedeAceptarCitaAlMismoDia(Patient paciente, Appointment huecoNuevo, LocalDate fecha) {
        // Obtener todas las citas del paciente ese día
        List<Appointment> citasEseDia = appointmentRepository.findPatientAppointmentsByDate(paciente.getId(), fecha);

        if (citasEseDia.isEmpty()) {
            return true; // Sin citas ese día, puede aceptar sin problemas
        }

        // Verificar si tiene cita de DIFERENTE especialidad
        boolean tieneCitaDiferenteEspecialidad = citasEseDia.stream()
                .anyMatch(apt -> apt.getDoctor().getSpecialty() != huecoNuevo.getDoctor().getSpecialty());

        if (tieneCitaDiferenteEspecialidad) {
            // Solo se comprueba que no haya solapamiento horario.
            for (Appointment citaExistente : citasEseDia) {
                if (citaExistente.getDoctor().getSpecialty() != huecoNuevo.getDoctor().getSpecialty()) {
                    boolean haySolapamiento = AppointmentService.hasTimeOverlap(
                            citaExistente.getStartTime(),
                            citaExistente.getDurationMinutes(),
                            huecoNuevo.getStartTime(),
                            huecoNuevo.getDurationMinutes());
                    if (haySolapamiento) {
                        System.out.println("Paciente " + paciente.getId() +
                                " tiene una cita de otra especialidad que se solapa con el hueco.");
                        return false;
                    }
                }
            }
        }

        // CASO: Tiene cita de la misma especialidad ese día
        // PERMITE SOLO si la cita posterior tiene MORE de 12 horas (regla de
        // cancelación)
        // Si acepta la reasignación, se cancelará la cita posterior automáticamente
        for (Appointment citaExistente : citasEseDia) {
            if (citaExistente.getDoctor().getSpecialty() == huecoNuevo.getDoctor().getSpecialty()) {
                long horasParaCita = java.time.temporal.ChronoUnit.HOURS.between(
                        LocalDateTime.now(),
                        citaExistente.getStartTime());

                if (horasParaCita <= 12) {
                    System.out.println("⚠️ Paciente " + paciente.getId() +
                            " tiene cita a las " + citaExistente.getStartTime() +
                            " (faltan " + horasParaCita + " horas). " +
                            "No se puede adelantar citas con menos de 12 horas de anticipación.");
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Valida si el paciente puede recibir una segunda cita de diferente
     * especialidad
     * el mismo día, considerando:
     * 1. No puede tener más de 2 citas en el mismo día
     * 2. No puede haber solapamiento de horarios entre las citas
     */
    private boolean puedeAsignarSegundaCitaDifEspecialidad(Patient paciente, Appointment huecoNuevo, LocalDate fecha) {
        // Obtener citas del paciente ese día
        List<Appointment> citasEseDia = appointmentRepository.findPatientAppointmentsByDate(paciente.getId(), fecha);

        // Si no tiene citas ese día, puede asignarse
        if (citasEseDia.isEmpty()) {
            return true;
        }

        // Si ya tiene 2 citas ese día, no puede asignarse más
        if (citasEseDia.size() >= 2) {
            System.out.println("Paciente " + paciente.getId() +
                    " ya tiene 2 citas el " + fecha + ". No se puede asignar más.");
            return false;
        }

        // Si tiene 1 cita, verificar que no hay solapamiento de horarios
        if (citasEseDia.size() == 1) {
            Appointment citaExistente = citasEseDia.get(0);

            // Verificar solapamiento
            boolean haySolapamiento = AppointmentService.hasTimeOverlap(
                    citaExistente.getStartTime(),
                    citaExistente.getDurationMinutes(),
                    huecoNuevo.getStartTime(),
                    huecoNuevo.getDurationMinutes());

            if (haySolapamiento) {
                System.out.println("Paciente " + paciente.getId() +
                        " tiene solapamiento de horarios. Cita existente: " + citaExistente.getStartTime() +
                        " (duración: " + citaExistente.getDurationMinutes() + " min), " +
                        "Nueva cita: " + huecoNuevo.getStartTime());
                return false;
            }

            return true;
        }

        return true;
    }

    public void guardarLog(Appointment apt, Patient original, Patient nuevo, String motivo) {
        ReassignmentLog log = new ReassignmentLog();
        log.setAppointment(apt);
        log.setOriginalPatient(original);
        log.setNewPatient(nuevo);
        log.setReason(motivo);
        log.setTimestamp(LocalDateTime.now());
        reassignmentLogRepository.save(log);
    }

    // Marca como EXPIRED todos los registros de lista de espera cuya fecha
    // preferida ya pasó
    @Transactional
    public void marcarListasEsperaExpiradas() {
        LocalDate hoy = LocalDate.now();
        List<WaitingList> registros = waitingListRepository.findAll();

        for (WaitingList w : registros) {
            // Si la fecha preferida ya pasó y sigue ACTIVE, marcar como EXPIRED
            if (w.getStatus() == com.autocita.backend.waitingList.WaitingListStatus.ACTIVE
                    && w.getPreferredDate().isBefore(hoy)) {
                w.setStatus(com.autocita.backend.waitingList.WaitingListStatus.EXPIRED);
                waitingListRepository.save(w);
            }
        }
    }

    // Actualiza el status de una entrada de lista de espera
    public void actualizarStatusListaEspera(Integer waitingListId,
            com.autocita.backend.waitingList.WaitingListStatus nuevoStatus) {
        waitingListRepository.findById(waitingListId).ifPresent(w -> {
            w.setStatus(nuevoStatus);
            waitingListRepository.save(w);
        });
    }

    @Transactional
    public void marcarListasEsperaComoAceptadas(Integer patientId, Specialty specialty) {
        List<WaitingList> registros = waitingListRepository.findByPatientId(patientId);

        for (WaitingList w : registros) {
            if (w.getStatus() == com.autocita.backend.waitingList.WaitingListStatus.OFFERED
                    && w.getSpecialty() == specialty) {
                w.setStatus(com.autocita.backend.waitingList.WaitingListStatus.ACCEPTED);
                waitingListRepository.save(w);
                break; // Solo marcar el primero (la que fue aceptada)
            }
        }
    }

    // Marca como REJECTED: rechazo explícito → excluido permanentemente
    @Transactional
    public void marcarListasEsperaComoRechazadas(Integer appointmentId, Integer patientId, Specialty specialty) {
        List<WaitingList> registros = waitingListRepository.findByPatientId(patientId);
        for (WaitingList w : registros) {
            if (w.getStatus() == com.autocita.backend.waitingList.WaitingListStatus.OFFERED
                    && w.getSpecialty() == specialty) {
                w.setStatus(com.autocita.backend.waitingList.WaitingListStatus.REJECTED);
                waitingListRepository.save(w);
            }
        }
    }

    // Marca como NOT_RESPONDED: no respondió a la oferta en tiempo → el algoritmo los reintenta en segunda vuelta
    @Transactional
    public void marcarListasEsperaComoNoRespondidas(Integer patientId, Specialty specialty) {
        List<WaitingList> registros = waitingListRepository.findByPatientId(patientId);
        for (WaitingList w : registros) {
            if (w.getStatus() == com.autocita.backend.waitingList.WaitingListStatus.OFFERED
                    && w.getSpecialty() == specialty) {
                w.setStatus(com.autocita.backend.waitingList.WaitingListStatus.NOT_RESPONDED);
                waitingListRepository.save(w);
            }
        }
    }
}
