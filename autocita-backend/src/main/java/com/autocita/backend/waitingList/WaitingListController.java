package com.autocita.backend.waitingList;

import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.patient.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/waiting-list")
public class WaitingListController {

    @Autowired
    private WaitingListRepository waitingListRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private com.autocita.backend.reassignmentLog.ReassignmentService reassignmentService;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<WaitingListResponse> getMyWaitlist(@PathVariable Integer patientId) {
        // Primero, marcar como expiradas las que corresponda
        reassignmentService.marcarListasEsperaExpiradas();

        // Obtener todas las solicitudes del paciente
        List<WaitingList> todas = waitingListRepository.findByPatientId(patientId);

        // Agrupar por estado
        WaitingListResponse response = new WaitingListResponse();
        response.setActive(todas.stream().filter(w -> w.getStatus() == WaitingListStatus.ACTIVE).toList());
        response.setOffered(todas.stream().filter(w -> w.getStatus() == WaitingListStatus.OFFERED).toList());
        response.setAccepted(todas.stream().filter(w -> w.getStatus() == WaitingListStatus.ACCEPTED).toList());
        response.setRejected(todas.stream().filter(w -> w.getStatus() == WaitingListStatus.REJECTED).toList());
        response.setNotResponded(todas.stream().filter(w -> w.getStatus() == WaitingListStatus.NOT_RESPONDED).toList());
        response.setExpired(todas.stream().filter(w -> w.getStatus() == WaitingListStatus.EXPIRED).toList());
        response.setCancelled(todas.stream().filter(w -> w.getStatus() == WaitingListStatus.CANCELLED).toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<String> addToWaitingList(
            @RequestParam Integer patientId,
            @RequestParam String specialty,
            @RequestParam String urgency,
            @RequestParam String timePref,
            @RequestParam(required = false) String preferredDate) {
        Patient p = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));

        // Validación de fecha/hora actual
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        // VALIDACIÓN PRINCIPAL: Máximo 3 solicitudes por día (sea cual sea la especialidad)
        long todayCount = waitingListRepository.countByPatientIdAndRequestDateToday(patientId, today);
        if (todayCount >= 3) {
            return ResponseEntity.badRequest().body(
                    "Ya has alcanzado el límite de 3 solicitudes de lista de espera por día. Vuelve mañana si quieres apuntarte a otra especialidad.");
        }

        Specialty selectedSpecialty = Specialty.valueOf(specialty);

        WaitingList entry = new WaitingList();
        entry.setPatient(p);
        entry.setSpecialty(selectedSpecialty);
        entry.setUrgency(UrgencyLevel.valueOf(urgency));
        entry.setTimePreference(TimePreference.valueOf(timePref));
        entry.setRequestDate(LocalDateTime.now());

        // Manejo de la fecha preferida
        LocalDate selectedDate;
        if (preferredDate != null && !preferredDate.isEmpty()) {
            selectedDate = LocalDate.parse(preferredDate);
        } else {
            selectedDate = LocalDate.now().plusDays(1); // Por defecto mañana
        }

        // VALIDACIÓN: La fecha debe estar dentro de los próximos 3 meses
        LocalDate maxDate = LocalDate.now().plusMonths(3);
        if (selectedDate.isAfter(maxDate)) {
            return ResponseEntity.badRequest().body(
                    "No puedes apuntarte a la lista de espera con más de 3 meses de anticipación. " +
                            "La fecha máxima permitida es: " + maxDate);
        }

        // La fecha no puede ser en el pasado
        if (selectedDate.isBefore(today)) {
            return ResponseEntity.badRequest().body(
                    "No puedes apuntarte para una fecha en el pasado.");
        }

        // No puedes tener dos solicitudes activas cuyas fechas preferidas
        // se solapan en la ventana de búsqueda del sistema (día del hueco + día siguiente)
        List<WaitingList> entradasActivas = waitingListRepository.findActiveByPatientId(patientId);
        for (WaitingList activa : entradasActivas) {
            long diasEntre = Math.abs(ChronoUnit.DAYS.between(activa.getPreferredDate(), selectedDate));
            if (diasEntre <= 1) {
                return ResponseEntity.badRequest().body(
                        "Ya tienes una solicitud activa en ese rango de fechas. No puedes añadir otra en días consecutivos.");
            }
        }

        // Validaciones de horario
        int currentHour = now.getHour();
        TimePreference selectedTimePreference = TimePreference.valueOf(timePref);

        // Si es por la tarde (después de mediodía) y selecciona fecha actual con
        // horario de mañana
        if (currentHour >= 12 && selectedDate.equals(today) && selectedTimePreference == TimePreference.MORNING) {
            return ResponseEntity.badRequest().body(
                    "No puedes reservar para la mañana cuando ya es por la tarde. Solo está disponible la tarde de hoy.");
        }

        // Si es muy tarde (después de las 5 PM) solo permite esperar para mañana
        // o cualquier horario
        if (currentHour >= 17 && selectedDate.equals(today) && selectedTimePreference != TimePreference.ANY) {
            return ResponseEntity.badRequest().body(
                    "Es demasiado tarde para reservar hoy. Selecciona un horario futuro o 'Cualquier horario'.");
        }

        entry.setPreferredDate(selectedDate);
        entry.setExpectedDurationMinutes(60);
        entry.setStatus(WaitingListStatus.ACTIVE); // Asegurar que es ACTIVE al crear

        waitingListRepository.save(entry);
        return ResponseEntity.ok("Añadido a lista de espera");
    }

    @DeleteMapping("/{waitingListId}")
    public ResponseEntity<String> removeFromWaitingList(
            @PathVariable Integer waitingListId,
            @RequestParam Integer patientId) {
        WaitingList entry = waitingListRepository.findById(waitingListId)
                .orElseThrow(() -> new RuntimeException("Solicitud de lista de espera no encontrada"));

        // Verificar que el paciente es propietario de esta solicitud
        if (!entry.getPatient().getId().equals(patientId)) {
            return ResponseEntity.status(403).body("No autorizado para eliminar esta solicitud");
        }

        waitingListRepository.deleteById(waitingListId);
        return ResponseEntity.ok("Solicitud eliminada de la lista de espera");
    }
}