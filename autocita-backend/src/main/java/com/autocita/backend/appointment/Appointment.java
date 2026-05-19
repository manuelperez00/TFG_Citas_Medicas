package com.autocita.backend.appointment;

import java.time.LocalDateTime;

import com.autocita.backend.doctor.Doctor;
import com.autocita.backend.model.BaseEntity;
import com.autocita.backend.patient.Patient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Appointment extends BaseEntity {

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes = 60;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AppointmentStatus status;

    @Column(name = "is_reassigned")
    private boolean isReassigned = false;

    @Column(name = "notes", length = 500, nullable = true)
    private String notes;

    @Column(name = "offered_at")
    private LocalDateTime offeredAt;

    @Column(name = "rating")
    private Integer rating;

    // DOCTOR
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments"})
    private Doctor doctor;

    // PATIENT
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments"})
    private Patient patient;

    public Appointment(LocalDateTime startTime, Doctor doctor) {
        this.startTime = startTime;
        this.doctor = doctor;
        this.status = AppointmentStatus.AVAILABLE;
        this.durationMinutes = 60;
        this.patient = null;
        this.isReassigned = false;
        this.notes = null;
    }
}
