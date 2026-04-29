package com.autocita.backend.waitingList;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.model.BaseEntity;
import com.autocita.backend.patient.Patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "waiting_list_entries")
@Getter
@Setter
@NoArgsConstructor
public class WaitingList extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Specialty specialty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UrgencyLevel urgency;

    @Column(nullable = false)
    private LocalDateTime requestDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TimePreference timePreference;

    @Column(nullable = false)
    private Integer expectedDurationMinutes = 60;

    @Column(nullable = false)
    private LocalDate preferredDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WaitingListStatus status = WaitingListStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    public WaitingList(Patient patient, Specialty specialty, UrgencyLevel urgency, TimePreference timePreference,
            LocalDate preferredDate) {
        this.patient = patient;
        this.specialty = specialty;
        this.urgency = urgency;
        this.timePreference = timePreference;
        this.requestDate = LocalDateTime.now();
        this.expectedDurationMinutes = 60;
        this.preferredDate = preferredDate;
    }
}
