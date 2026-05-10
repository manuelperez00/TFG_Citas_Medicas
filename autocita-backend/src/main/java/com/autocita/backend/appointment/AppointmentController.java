package com.autocita.backend.appointment;

import com.autocita.backend.doctor.Doctor;
import com.autocita.backend.doctor.DoctorRepository;
import com.autocita.backend.patient.PatientRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAll());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByPatient(@PathVariable Integer patientId) {
        return ResponseEntity.ok(appointmentRepository.findByPatientId(patientId));
    }

    @GetMapping("/my-id")
    public ResponseEntity<?> getMyPatientId(java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("No estás logueado");
        }

        String username = principal.getName();

        var patientOpt = patientRepository.findByUserUsername(username);

        if (patientOpt.isPresent()) {
            return ResponseEntity.ok(patientOpt.get().getId());
        } else {
            return ResponseEntity.badRequest().body("No tienes ficha de paciente creada.");
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(@PathVariable Integer doctorId) {
        // Devuelve todas las citas de ese médico
        return ResponseEntity.ok(appointmentRepository.findByDoctorId(doctorId));
    }

    @GetMapping("/doctor/{doctorId}/stats")
    public ResponseEntity<?> getDoctorStats(@PathVariable Integer doctorId) {
        long confirmed = appointmentRepository.countByDoctorIdAndStatus(doctorId, AppointmentStatus.ASSIGNED);
        long completed = appointmentRepository.countByDoctorIdAndStatus(doctorId, AppointmentStatus.COMPLETED);
        
        return ResponseEntity.ok(Map.of("confirmed", confirmed, "completed", completed));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmAppointment(@PathVariable Integer id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada con el ID: " + id));

        appointment.setStatus(AppointmentStatus.ASSIGNED);
        appointmentRepository.save(appointment);

        return ResponseEntity.ok().body("{\"message\": \"Cita confirmada\"}");
    }

    @PostMapping
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ResponseEntity<?> createAppointment(@Valid @RequestBody AppointmentRequest request) {

        var doctorOpt = doctorRepository.findById(request.getDoctorId());
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Médico no encontrado");
        }
        Doctor doctor = doctorOpt.get();

        // VALIDACIÓN: La fecha de la cita debe estar dentro de los próximos 3 meses
        LocalDateTime maxDateTime = LocalDateTime.now().plusMonths(3);
        if (request.getStartTime().isAfter(maxDateTime)) {
            return ResponseEntity.badRequest().body(
                    "No puedes reservar citas con más de 3 meses de anticipación. " +
                            "La fecha máxima permitida es: " + maxDateTime.toLocalDate());
        }

        // Validación de turno
        if (!AppointmentService.isWithinDoctorShift(request.getStartTime(), doctor.getWorkShift())) {
            return ResponseEntity.badRequest()
                    .body("No puedes reservar en ese horario, el médico solo atiende en turno "
                            + doctor.getWorkShift());
        }

        // Validación de bloqueo explícito
        if (appointmentRepository.existsByDoctorIdAndStartTimeAndStatus(request.getDoctorId(), request.getStartTime(),
                AppointmentStatus.BLOCKED)) {
            return ResponseEntity.badRequest().body("El médico ha bloqueado ese horario.");
        }

        // 1. BUSCAR SI YA EXISTE UN REGISTRO PARA ESE MÉDICO Y ESA HORA
        var existingAppOpt = appointmentRepository.findByDoctorIdAndStartTimeActiveOnly(request.getDoctorId(),
                request.getStartTime());

        if (existingAppOpt.isPresent()) {
            Appointment existingApp = existingAppOpt.get();

            // Si está bloqueada, no puedo reservar.
            if (existingApp.getStatus() == AppointmentStatus.BLOCKED) {
                return ResponseEntity.badRequest().body("El médico ha bloqueado ese horario.");
            }

            // Si ya ocupa con cita real, no se puede reservar.
            if (existingApp.getStatus() == AppointmentStatus.ASSIGNED ||
                    existingApp.getStatus() == AppointmentStatus.OFFERED ||
                    existingApp.getStatus() == AppointmentStatus.REASSIGNED ||
                    existingApp.getStatus() == AppointmentStatus.COMPLETED) {
                return ResponseEntity.badRequest()
                        .body("El médico ya tiene una cita en esa hora.");
            }

            // Reutilizamos hueco AVAILABLE o rejected y entregamos asignada
            // directamente.
            return processBooking(existingApp, request, AppointmentStatus.ASSIGNED);
        }

        // 2. VALIDACIÓN PARA EL PACIENTE (No puede tener dos citas activas a la misma hora)
        if (appointmentRepository.existsActiveByPatientIdAndStartTime(request.getPatientId(), request.getStartTime())) {
            return ResponseEntity.badRequest().body("Ya tienes una cita reservada a esa hora.");
        }

        // 3. CREACIÓN DE CITA NUEVA (Si no existía ningún registro previo en ese
        // horario)
        Appointment newAppointment = new Appointment();
        return processBooking(newAppointment, request, AppointmentStatus.ASSIGNED);
    }

    @PostMapping("/{id}/respond-offer")
    public ResponseEntity<Void> respondOffer(
            @PathVariable Integer id,
            @RequestParam boolean accepted) {
        appointmentService.handleReassignmentResponse(id, accepted);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/respond-via-email")
    public ResponseEntity<?> respondViaEmail(
            @RequestParam String token,
            @RequestParam boolean accepted) {
        try {
            appointmentService.handleEmailResponse(token, accepted);
            if (accepted) {
                return ResponseEntity.ok().body(
                        "✅ ¡Cita confirmada! Ya tienes tu cita programada. Puedes verla en tu plataforma AutoCita.");
            } else {
                return ResponseEntity.ok().body(
                        "❌ Cita rechazada. Volveremos a intentar ofrecerte otros huecos disponibles. Puedes revisar otros horarios en tu plataforma.");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    "❌ El token ha expirado o es inválido. Por favor, verifica tu oferta en la plataforma AutoCita.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                    "❌ Error procesando tu respuesta. Por favor, intenta desde la plataforma.");
        }
    }

    private ResponseEntity<?> processBooking(Appointment appointment, AppointmentRequest request,
            AppointmentStatus status) {
        try {
            System.out.println("processBooking START - Doctor: " + request.getDoctorId() +
                    ", Patient: " + request.getPatientId() + ", Status: " + status);

            var doctorOpt = doctorRepository.findById(request.getDoctorId());
            var patientOpt = patientRepository.findById(request.getPatientId());

            if (doctorOpt.isEmpty() || patientOpt.isEmpty()) {
                System.out.println("❌ Doctor o Paciente no encontrado");
                return ResponseEntity.badRequest().body("Médico o Paciente no encontrado");
            }

            appointment.setDoctor(doctorOpt.get());
            appointment.setPatient(patientOpt.get());
            appointment.setStartTime(request.getStartTime());
            appointment.setStatus(status);
            appointment.setNotes(null);

            // Asegurar que durationMinutes siempre tenga un valor (por defecto 60 minutos)
            if (appointment.getDurationMinutes() == null) {
                System.out.println("⚠️ durationMinutes era null, seteando a 60");
                appointment.setDurationMinutes(60);
            }

            System.out.println("✅ Guardando appointment: " + appointment.getId() +
                    ", Doctor: " + appointment.getDoctor().getId() +
                    ", Patient: " + appointment.getPatient().getId() +
                    ", Duration: " + appointment.getDurationMinutes());

            Appointment saved = appointmentRepository.save(appointment);
            System.out.println("✅ processBooking SUCCESS - Appointment guardada con ID: " + saved.getId());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("❌ processBooking ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error procesando la cita: " + e.getMessage());
        }
    }

    // (cancel-and-reassign)
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointmentByPatient(@PathVariable Integer id) {
        try {
            // 1. Buscamos la cita
            Appointment appointment = appointmentRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));

            // 2. Validación de regla de negocio: ¿Faltan más de 12 horas?
            if (appointment.getStartTime().isBefore(LocalDateTime.now().plusHours(12))) {
                return ResponseEntity.badRequest().body("Solo puedes cancelar con 12h de antelación.");
            }

            // 3. Validación: Solo se pueden cancelar citas que ya eran "suyas" (ASSIGNED)
            if (!appointment.getStatus().equals(AppointmentStatus.ASSIGNED)) {
                return ResponseEntity.badRequest().body("Esta cita no está asignada.");
            }

            appointmentService.cancelAppointment(id);

            return ResponseEntity.ok().body("{\"message\": \"Cita cancelada. Hueco liberado para reasignación.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/{appointmentId}/block")
    public ResponseEntity<?> blockAppointmentSlot(@PathVariable Integer appointmentId,
            @RequestBody BlockSlotRequest request) {
        return appointmentRepository.findById(appointmentId)
                .map(app -> {
                    System.out.println("✅ Bloqueando slot " + appointmentId + " con motivo: " + request.getReason());
                    app.setStatus(AppointmentStatus.BLOCKED);
                    app.setNotes(request.getReason());
                    appointmentRepository.save(app);
                    System.out.println("✅ Slot bloqueado exitosamente. Status = " + app.getStatus());
                    return ResponseEntity.ok().body("{\"message\": \"Hueco bloqueado\"}");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/doctor/{doctorId}/block")
    @Transactional
    public ResponseEntity<?> blockDoctorTimeRange(@PathVariable Integer doctorId,
            @Valid @RequestBody BlockAppointmentRequest request) {
        System.out.println("INICIO: Bloqueando para doctor ID " + doctorId);
        System.out.println("   startTime (raw): " + request.getStartTime());
        System.out.println("   endTime (raw): " + request.getEndTime());
        System.out.println("   reason: " + request.getReason());

        // Parsear fechas desde strings locales
        LocalDateTime startTime = request.getStartTimeAsLocalDateTime();
        LocalDateTime endTime = request.getEndTimeAsLocalDateTime();

        if (startTime == null || endTime == null) {
            System.out.println("Error parseando fechas");
            return ResponseEntity.badRequest()
                    .body("Formato de fecha inválido. Use ISO_LOCAL_DATE_TIME (YYYY-MM-DDTHH:mm:ss)");
        }

        System.out.println("   startTime (parsed): " + startTime);
        System.out.println("   endTime (parsed): " + endTime);

        var doctorOpt = doctorRepository.findById(doctorId);
        if (doctorOpt.isEmpty()) {
            System.out.println("Doctor no encontrado");
            return ResponseEntity.badRequest().body("Médico no encontrado");
        }

        // Validar mínimo 24 horas
        if (!request.isValidMinimum24Hours()) {
            System.out.println("Bloqueo NO cumple mínimo 24 horas");
            LocalDateTime now = LocalDateTime.now();
            return ResponseEntity.badRequest()
                    .body("El bloqueo debe ser de mínimo 24 horas desde ahora. startTime: " + startTime + ", now: "
                            + now);
        }

        if (!endTime.isAfter(startTime)) {
            System.out.println("Fecha fin no es posterior a fecha inicio");
            return ResponseEntity.badRequest().body("La fecha de fin debe ser posterior a la fecha de inicio.");
        }

        Doctor doctor = doctorOpt.get();

        var current = startTime;

        // Verificar que NO hay citas ocupadas en el rango completo
        while (current.isBefore(endTime)) {
            var appointmentOpt = appointmentRepository.findByDoctorIdAndStartTime(doctorId, current);

            if (appointmentOpt.isPresent()) {
                var existing = appointmentOpt.get();
                if (existing.getStatus() == AppointmentStatus.ASSIGNED ||
                        existing.getStatus() == AppointmentStatus.OFFERED ||
                        existing.getStatus() == AppointmentStatus.REASSIGNED) {
                    System.out.println("Hay cita confirmada en " + current);
                    return ResponseEntity.badRequest().body(
                            "No se puede bloquear porque hay citas confirmadas en este horario (" + current + "). " +
                                    "Todos los horarios del rango deben estar disponibles para crear un bloqueo.");
                }
            }
            current = current.plusHours(1);
        }

        // Si pasó la validación, proceder a bloquear
        current = startTime;
        while (current.isBefore(endTime)) {
            var appointmentOpt = appointmentRepository.findByDoctorIdAndStartTime(doctorId, current);

            if (appointmentOpt.isPresent()) {
                var existing = appointmentOpt.get();
                // Cambiar estado a BLOCKED
                System.out.println("✅ Actualizando cita existente a BLOCKED: " + current);
                existing.setStatus(AppointmentStatus.BLOCKED);
                existing.setPatient(null);
                existing.setNotes(request.getReason());
                appointmentRepository.save(existing);
            } else {
                // Si no existe, crear nuevo bloqueo
                System.out.println("✅ Creando nuevo bloqueo: " + current);
                var blocked = new Appointment();
                blocked.setDoctor(doctor);
                blocked.setStartTime(current);
                blocked.setDurationMinutes(60);
                blocked.setStatus(AppointmentStatus.BLOCKED);
                blocked.setNotes(request.getReason());
                appointmentRepository.save(blocked);
            }
            current = current.plusHours(1);
        }

        System.out.println("✅ Rango de bloqueo registrado exitosamente");
        return ResponseEntity.ok().body("{\"message\": \"Rango de bloqueo registrado exitosamente\"}");
    }

    @PatchMapping("/{id}/rating")
    public ResponseEntity<?> rateAppointment(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        var opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Appointment appointment = opt.get();
        if (appointment.getStatus() != AppointmentStatus.COMPLETED)
            return ResponseEntity.badRequest().body("Solo se pueden valorar citas completadas.");
        Integer rating = ((Number) body.get("rating")).intValue();
        if (rating < 1 || rating > 5)
            return ResponseEntity.badRequest().body("La valoración debe ser entre 1 y 5.");
        appointment.setRating(rating);
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    @GetMapping("/doctor/{doctorId}/rating")
    public ResponseEntity<?> getDoctorRating(@PathVariable Integer doctorId) {
        Double avg = appointmentRepository.getAverageRatingByDoctorId(doctorId);
        Long count = appointmentRepository.countRatedByDoctorId(doctorId);
        double rounded = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
        return ResponseEntity.ok(Map.of("avgRating", rounded, "totalRatings", count != null ? count : 0L));
    }

    @GetMapping("/ratings/all")
    public ResponseEntity<?> getAllDoctorRatings() {
        java.util.Map<Integer, Object> result = new java.util.HashMap<>();
        for (com.autocita.backend.doctor.Doctor doc : doctorRepository.findAll()) {
            Double avg = appointmentRepository.getAverageRatingByDoctorId(doc.getId());
            Long count = appointmentRepository.countRatedByDoctorId(doc.getId());
            double rounded = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
            result.put(doc.getId(), Map.of("avgRating", rounded, "totalRatings", count != null ? count : 0L));
        }
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Integer id) {
        if (appointmentRepository.existsById(id)) {
            appointmentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}