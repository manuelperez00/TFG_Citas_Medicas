package com.autocita.backend.prescription;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.doctor.Doctor;
import com.autocita.backend.medication.Medication;
import com.autocita.backend.model.BaseEntity;
import com.autocita.backend.patient.Patient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Prescription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "doctor", "patient", "notes", "offeredAt", "reassigned"})
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Medication medication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments", "user"})
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments", "user"})
    private Doctor doctor;

    @Column(name = "prescribed_at", nullable = false)
    private LocalDateTime prescribedAt;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(length = 500)
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (this.prescribedAt == null) this.prescribedAt = LocalDateTime.now();
    }
}
