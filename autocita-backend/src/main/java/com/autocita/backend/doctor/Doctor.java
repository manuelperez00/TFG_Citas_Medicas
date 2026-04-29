package com.autocita.backend.doctor;

import java.time.LocalDateTime;

import com.autocita.backend.model.Person;
import com.autocita.backend.security.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Doctor extends Person {

    // Professional data
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Specialty specialty;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkShift workShift;

    @NotBlank
    @Column(unique = true, nullable = false, length = 10)
    @Pattern(regexp = "^MED-[a-zA-Z0-9]{6}$", message = "El formato debe ser MED- seguido de 6 caracteres alfanuméricos (ej: MED-123456)")
    private String licenseNumber;

    // Contact information
    @NotNull
    @Email
    @Column(unique = true, nullable = false)
    private String email;

    @NotNull
    @Pattern(regexp = "^[0-9]{9}$", message = "El teléfono debe tener 9 dígitos")
    @Column(nullable = false)
    private String phone;

    // State
    @Column(nullable = false)
    private boolean active;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.active = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Doctor(String firstName, String lastName, Specialty specialty, WorkShift workShift,
            String licenseNumber, String email, String phone) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.specialty = specialty;
        this.workShift = workShift;
        this.licenseNumber = licenseNumber;
        this.email = email;
        this.phone = phone;
    }
}
