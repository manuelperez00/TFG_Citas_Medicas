package com.autocita.backend.patient;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.autocita.backend.model.Person;
import com.autocita.backend.security.User;

import jakarta.persistence.CascadeType;
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
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Patient extends Person {

    // Personal Data
    @NotNull
    @PastOrPresent(message = "La fecha de nacimiento no puede ser futura")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Gender gender;

    @NotBlank
    @Column(unique = true, nullable = false)
    @Pattern(regexp = "^[0-9]{8}[A-Z]$", message = "El DNI no es válido")
    private String documentId;

    @Size(max = 255, message = "La dirección no puede superar 255 caracteres")
    private String address;

    // Contact Information
    @NotNull
    @Column(unique = true)
    @Email
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
        if (this.gender == null) this.gender = Gender.UNDISCLOSED;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @OneToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "user_id")
    private User user;

    public Patient(String firstName, String lastName, LocalDate birthDate, Gender gender,
            String documentId,String address, String email, String phone) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
        this.gender = gender;
        this.documentId = documentId;
        this.address = address;
        this.email = email;
        this.phone = phone;
    }

}
