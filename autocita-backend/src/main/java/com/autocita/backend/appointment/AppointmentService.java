package com.autocita.backend.appointment;

import com.autocita.backend.doctor.WorkShift;
import com.autocita.backend.email.EmailResponseToken;
import com.autocita.backend.email.EmailResponseTokenRepository;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.reassignmentLog.ReassignmentService;
import com.autocita.backend.waitingList.WaitingListRepository;

import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

        @Autowired
        private AppointmentRepository appointmentRepository;

        @Autowired
        private ReassignmentService reassignmentService;

        @Autowired
        private WaitingListRepository waitingListRepository;

        @Autowired
        private EmailResponseTokenRepository emailTokenRepository;

        @Transactional
        public void cancelAppointment(Integer appointmentId) {
                Appointment appointment = appointmentRepository.findById(appointmentId)
                                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));

                if (appointment.getStatus() == AppointmentStatus.AVAILABLE) {
                        throw new IllegalStateException("Esta cita ya está libre");
                }

                Patient oldPatient = appointment.getPatient();

                // 1. Marcar la cita como REJECTED pero MANTENER al paciente original
                // Así aparecerá en su lista de citas canceladas
                appointment.setStatus(AppointmentStatus.REJECTED);
                appointmentRepository.save(appointment);

                // 2. Crear un nuevo slot AVAILABLE para reasignación a otros candidatos
                Appointment newSlot = new Appointment();
                newSlot.setDoctor(appointment.getDoctor());
                newSlot.setStartTime(appointment.getStartTime());
                newSlot.setStatus(AppointmentStatus.AVAILABLE);
                newSlot.setPatient(null);
                appointmentRepository.save(newSlot);

                // 3. Procesar reasignación sobre el nuevo slot, no la cita cancelada del
                // usuario
                reassignmentService.procesarReasignacion(newSlot, oldPatient);
        }

        // NUEVO
        public static boolean isWithinDoctorShift(LocalDateTime startTime, WorkShift shift) {
                int hour = startTime.getHour();
                switch (shift) {
                        case MORNING:
                                return hour >= 9 && hour <= 13; // entre 09:00 y 13:59 (09, 10, 11, 12, 13)
                        case AFTERNOON:
                                return hour >= 16 && hour <= 20; // entre 16:00 y 20:59 (16, 17, 18, 19, 20)
                        case ANY:
                                return true;
                        default:
                                return false;
                }
        }

        // Verifica si hay solapamiento de horarios entre dos citas.
        public static boolean hasTimeOverlap(LocalDateTime start1, Integer duration1,
                        LocalDateTime start2, Integer duration2) {
                // Calcular tiempos finales
                LocalDateTime end1 = start1.plusMinutes(duration1);
                LocalDateTime end2 = start2.plusMinutes(duration2);

                // Hay solapamiento si:
                // - start1 < end2 AND start2 < end1
                return start1.isBefore(end2) && start2.isBefore(end1);
        }

        @Transactional
        public void handleReassignmentResponse(Integer appointmentId, boolean accepted) {
                // Llamar al método completo sin marcar como timeout
                handleReassignmentResponse(appointmentId, accepted, false);
        }

        @Transactional
        public void handleReassignmentResponse(Integer appointmentId, boolean accepted, boolean isTimeout) {
                Appointment appointment = appointmentRepository.findById(appointmentId)
                                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));

                Patient pacienteCandidato = appointment.getPatient();

                if (accepted) {
                        // Caso A: El paciente acepta la notificación
                        appointment.setStatus(AppointmentStatus.ASSIGNED);
                        appointment.setReassigned(true);
                        appointmentRepository.save(appointment);

                        System.out.println("✅ Cita reasignada aceptada - ID: " + appointmentId +
                                        " - Fecha: " + appointment.getStartTime() +
                                        " - Especialidad: " + appointment.getDoctor().getSpecialty());

                        // Marcar la entrada de lista de espera ACTUAL como ACCEPTED
                        reassignmentService.marcarListasEsperaComoAceptadas(
                                        pacienteCandidato.getId(),
                                        appointment.getDoctor().getSpecialty());

                        System.out.println("✅ Solicitud de lista de espera marcada como ACCEPTED para paciente ID: " +
                                        pacienteCandidato.getId());

                        // Limpiar solicitudes de espera POSTERIORES de la misma especialidad
                        // (Ya no las necesita porque consiguió su cita)
                        LocalDate acceptedDate = appointment.getStartTime().toLocalDate();
                        waitingListRepository.deleteByPatientIdAndSpecialtyAfterDate(
                                        pacienteCandidato.getId(),
                                        appointment.getDoctor().getSpecialty(),
                                        acceptedDate);

                        System.out.println("✅ Eliminadas solicitudes futuras de " +
                                        appointment.getDoctor().getSpecialty() +
                                        " posteriores al " + acceptedDate);

                        cancelFutureAssignedAppointmentsSameSpecialty(pacienteCandidato, appointment);

                } else {
                        // Caso B: El paciente rechaza o no responde (Pasar al siguiente)
                        String motivo = isTimeout ? "NOT_RESPONDED" : "OFERTA_RECHAZADA";
                        reassignmentService.guardarLog(appointment, null, pacienteCandidato, motivo);

                        // Marcar la entrada de lista de espera como REJECTED EN VEZ DE ELIMINAR
                        // Esto permite conservar el historial y que el paciente vea por qué fue
                        // rechazada
                        reassignmentService.marcarListasEsperaComoRechazadas(
                                        appointment.getId(),
                                        pacienteCandidato.getId(),
                                        appointment.getDoctor().getSpecialty());

                        System.out.println("❌ Solicitud de lista de espera marcada como REJECTED para paciente ID: " +
                                        pacienteCandidato.getId() +
                                        " - Especialidad: " + appointment.getDoctor().getSpecialty() +
                                        " - Motivo: " + motivo);

                        // Vaciamos el paciente actual y volvemos a ejecutar el algoritmo (CASCADA
                        // AUTOMÁTICA)
                        // Como ahora existe un log de rechazo/timeout, el filtro de excluidos lo
                        // saltará
                        // Y el status de la lista de espera es REJECTED, no aparecerá en candidatos
                        appointment.setPatient(null);
                        reassignmentService.procesarReasignacion(appointment, null);
                }
        }

        @Transactional
        private void cancelFutureAssignedAppointmentsSameSpecialty(Patient patient, Appointment assignedAppointment) {
                com.autocita.backend.doctor.Specialty specialty = assignedAppointment.getDoctor().getSpecialty();
                LocalDateTime assignedTime = assignedAppointment.getStartTime();

                List<Appointment> allAppointments = appointmentRepository.findByPatientId(patient.getId());

                // Filtrar: citas ASIGNADAS posteriores con la misma especialidad
                List<Appointment> futureAssignedAppointments = allAppointments.stream()
                                .filter(apt -> apt.getStartTime().isAfter(assignedTime)) // Solo posteriores
                                .filter(apt -> apt.getDoctor().getSpecialty() == specialty) // Misma especialidad
                                .filter(apt -> !apt.getId().equals(assignedAppointment.getId())) // No la recién
                                                                                                 // asignada
                                .filter(apt -> apt.getStatus() == AppointmentStatus.ASSIGNED) // Solo ASIGNADAS
                                .toList();

                // Cancelar cada cita posterior y relanzar algoritmo
                for (Appointment futureAppointment : futureAssignedAppointments) {
                        // Validar que faltan más de 12 horas para poder cancelar
                        long horasParaCita = java.time.temporal.ChronoUnit.HOURS.between(
                                        LocalDateTime.now(),
                                        futureAppointment.getStartTime());

                        if (horasParaCita <= 12) {
                                System.out.println("⚠️ NO se puede cancelar cita ID: " + futureAppointment.getId() +
                                                " Fecha: " + futureAppointment.getStartTime() +
                                                " | Faltan solo " + horasParaCita + " horas (mínimo 12 requeridas)");
                                continue; // Saltamos esta cita, no se cancela
                        }

                        System.out.println("🔄 CANCELANDO cita ASIGNADA posterior ID: " + futureAppointment.getId() +
                                        " Fecha: " + futureAppointment.getStartTime() +
                                        " | Paciente ID: " + patient.getId() +
                                        " | Motivo: Aceptación de cita anterior en lista de espera");

                        // 1. Marcar como REJECTED pero MANTENER al paciente original
                        // Así el paciente verá en su lista que fue rechazada
                        futureAppointment.setStatus(AppointmentStatus.REJECTED);
                        futureAppointment.setNotes(
                                        "Rechazada: El paciente aceptó una cita anterior de la misma especialidad (" +
                                                        "[" + assignedAppointment.getStartTime() + "]" +
                                                        ") que estaba buscando en la lista de espera");
                        appointmentRepository.save(futureAppointment);

                        // 2. Crear nuevo slot AVAILABLE para que otros pacientes en lista de espera
                        // puedan aceptarlo
                        Appointment newSlot = new Appointment();
                        newSlot.setDoctor(futureAppointment.getDoctor());
                        newSlot.setStartTime(futureAppointment.getStartTime());
                        newSlot.setStatus(AppointmentStatus.AVAILABLE);
                        newSlot.setPatient(null);
                        appointmentRepository.save(newSlot);

                        reassignmentService.guardarLog(
                                        futureAppointment,
                                        patient,
                                        null,
                                        "LIBERADA_POR_ACEPTACION_LISTA_ESPERA_ANTERIOR");

                        // 3. Relanzar algoritmo de reasignación sobre el nuevo slot
                        System.out.println("🔄 RELANZANDO ALGORITMO DE REASIGNACIÓN para hueco del " +
                                        futureAppointment.getStartTime());
                        reassignmentService.procesarReasignacion(newSlot, patient);
                }
        }

        @Transactional
        private void cancelFutureAppointmentsSameSpecialty(Patient patient, Appointment assignedAppointment) {
                // Obtener la especialidad con la que se acaba de asignar la cita
                com.autocita.backend.doctor.Specialty specialty = assignedAppointment.getDoctor().getSpecialty();

                // Obtener todas las citas del paciente
                List<Appointment> allAppointments = appointmentRepository.findByPatientId(patient.getId());

                // Filtrar: citas futuras, con la misma especialidad, y que no sean la cita
                // recién asignada
                LocalDateTime assignedTime = assignedAppointment.getStartTime();
                List<Appointment> futureAppointmentsSameSpecialty = allAppointments.stream()
                                .filter(apt -> apt.getStartTime().isAfter(assignedTime)) // Solo futuras
                                .filter(apt -> apt.getDoctor().getSpecialty() == specialty) // Misma especialidad
                                .filter(apt -> !apt.getId().equals(assignedAppointment.getId())) // No la recién
                                                                                                 // asignada
                                .filter(apt -> apt.getStatus() == AppointmentStatus.ASSIGNED) // Solo ASSIGNED
                                .toList();

                // Cancelar cada cita futura y relanzar algoritmo
                for (Appointment futureAppointment : futureAppointmentsSameSpecialty) {
                        System.out.println("🔄 CANCELANDO cita futura ID: " + futureAppointment.getId() +
                                        " Fecha: " + futureAppointment.getStartTime() +
                                        " Estado: " + futureAppointment.getStatus() +
                                        " | Paciente ID: " + patient.getId() +
                                        " | Especialidad: " + specialty +
                                        " | Motivo: Consiguió cita anterior (mejor momento)");

                        // Marcar como rechazada
                        futureAppointment.setStatus(AppointmentStatus.REJECTED);
                        futureAppointment.setNotes(
                                        "Cancelada automáticamente: El paciente consiguió una cita anterior de la misma especialidad ("
                                                        +
                                                        "[" + assignedAppointment.getStartTime() + "]" +
                                                        ") que es el objetivo por el que estaba en lista de espera");
                        appointmentRepository.save(futureAppointment);

                        // Guardar log de rechazo
                        reassignmentService.guardarLog(
                                        futureAppointment,
                                        patient,
                                        null,
                                        "CANCELADA_POR_ASIGNACION_LISTA_ESPERA");

                        // Relanzar algoritmo para intentar reasignar este hueco a otro paciente
                        Appointment emptySlot = futureAppointment;
                        emptySlot.setPatient(null);
                        reassignmentService.procesarReasignacion(emptySlot, patient);
                }
        }

        /**
         * Procesa la respuesta del paciente a través del email usando un token
         * Este método es llamado cuando el paciente hace clic en los links del email
         */
        @Transactional
        public void handleEmailResponse(String token, boolean accepted) {
                // Buscar el token
                EmailResponseToken emailToken = emailTokenRepository.findByToken(token)
                                .orElseThrow(() -> new IllegalArgumentException("Token inválido o expirado"));

                // Validar que el token no haya sido usado
                if (emailToken.isUsed()) {
                        throw new IllegalArgumentException("El token ya fue utilizado previamente");
                }

                // Validar que no haya expirado
                if (LocalDateTime.now().isAfter(emailToken.getExpiresAt())) {
                        System.out.println("❌ TOKEN EXPIRADO - Cita ID: " + emailToken.getAppointment().getId() +
                                        " - Paciente: " + emailToken.getPatient().getEmail() +
                                        " - Procesando como NOT_RESPONDED");

                        // Marcar token como usado con respuesta nula (expirado)
                        emailToken.setUsed(true);
                        emailToken.setUsedAt(LocalDateTime.now());
                        emailToken.setResponse(null);
                        emailTokenRepository.save(emailToken);

                        // Procesar como rechazada con marca de timeout para pasar al siguiente
                        // candidato
                        handleReassignmentResponse(emailToken.getAppointment().getId(), false, true);
                        throw new IllegalArgumentException(
                                        "El token ha expirado (más de 15 minutos). La cita ha sido ofrecida al siguiente candidato en la lista de espera.");
                }

                // Marcar token como usado
                emailToken.setUsed(true);
                emailToken.setUsedAt(LocalDateTime.now());
                emailToken.setResponse(accepted);
                emailTokenRepository.save(emailToken);

                // Procesar la respuesta (aceptar o rechazar la cita)
                // Usamos isTimeout=false porque es una respuesta explícita
                Appointment appointment = emailToken.getAppointment();
                handleReassignmentResponse(appointment.getId(), accepted, false);
        }
}