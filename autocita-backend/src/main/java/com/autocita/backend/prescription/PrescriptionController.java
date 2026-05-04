package com.autocita.backend.prescription;

import com.autocita.backend.appointment.AppointmentRepository;
import com.autocita.backend.medication.MedicationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicationRepository medicationRepository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Prescription>> getByPatient(@PathVariable Integer patientId) {
        return ResponseEntity.ok(prescriptionRepository.findByPatientId(patientId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<Prescription>> getByAppointment(@PathVariable Integer appointmentId) {
        return ResponseEntity.ok(prescriptionRepository.findByAppointmentId(appointmentId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Integer appointmentId = (Integer) body.get("appointmentId");
            Integer medicationId = (Integer) body.get("medicationId");
            String notes = (String) body.get("notes");

            var appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada"));
            var medication = medicationRepository.findById(medicationId)
                    .orElseThrow(() -> new EntityNotFoundException("Medicamento no encontrado"));

            if (appointment.getPatient() == null) {
                return ResponseEntity.badRequest().body("La cita no tiene paciente asignado.");
            }

            Integer durationDays = body.get("durationDays") != null
                    ? ((Number) body.get("durationDays")).intValue()
                    : null;

            java.time.LocalDateTime now = java.time.LocalDateTime.now();

            Prescription prescription = new Prescription();
            prescription.setAppointment(appointment);
            prescription.setMedication(medication);
            prescription.setPatient(appointment.getPatient());
            prescription.setDoctor(appointment.getDoctor());
            prescription.setNotes(notes);
            prescription.setPrescribedAt(now);
            prescription.setDurationDays(durationDays);
            if (durationDays != null) {
                prescription.setExpiresAt(now.plusDays(durationDays));
            }

            return ResponseEntity.ok(prescriptionRepository.save(prescription));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (prescriptionRepository.existsById(id)) {
            prescriptionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
