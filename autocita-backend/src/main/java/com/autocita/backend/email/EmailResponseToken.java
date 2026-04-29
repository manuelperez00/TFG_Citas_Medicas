package com.autocita.backend.email;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.model.BaseEntity;
import com.autocita.backend.patient.Patient;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_response_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailResponseToken extends BaseEntity {

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = true)
    private LocalDateTime usedAt;

    @Column(nullable = true)
    private Boolean response; // true = aceptar, false = rechazar, null = sin usar

    public EmailResponseToken(String token, Appointment appointment, Patient patient, LocalDateTime expiresAt) {
        this.token = token;
        this.appointment = appointment;
        this.patient = patient;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    public boolean isValid() {
        return !used && LocalDateTime.now().isBefore(expiresAt);
    }
}
