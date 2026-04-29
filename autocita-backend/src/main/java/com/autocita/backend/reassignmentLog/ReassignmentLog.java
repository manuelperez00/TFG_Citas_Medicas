package com.autocita.backend.reassignmentLog;

import java.time.LocalDateTime;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.model.BaseEntity;
import com.autocita.backend.patient.Patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "reassignment_logs")
@Getter
@Setter
@NoArgsConstructor
public class ReassignmentLog extends BaseEntity {

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // ¿POR QUÉ GANÓ?
    @Column(nullable = false)
    private String reason;

    @ManyToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne
    @JoinColumn(name = "original_patient_id")
    private Patient originalPatient;

    // El ganador del algoritmo
    @ManyToOne
    @JoinColumn(name = "new_patient_id")
    private Patient newPatient;

    public ReassignmentLog(Appointment appointment, Patient original, Patient neu, String reason) {
        this.appointment = appointment;
        this.originalPatient = original;
        this.newPatient = neu;
        this.reason = reason;
        this.timestamp = LocalDateTime.now();
    }
}
