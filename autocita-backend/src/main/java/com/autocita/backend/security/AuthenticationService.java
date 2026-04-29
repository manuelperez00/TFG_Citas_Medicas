package com.autocita.backend.security;

import com.autocita.backend.dto.RegisterRequest;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.patient.Gender;
import com.autocita.backend.patient.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public void registerPatient(RegisterRequest request) {

        // Validaciones básicas
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya existe");
        }
        if (patientRepository.existsByDocumentId(request.getDocumentId())) {
            throw new RuntimeException("Ya existe un paciente con ese DNI");
        }

        // Crear Usuario
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.PATIENT);
        user.setEnabled(true);

        // Crear el Paciente
        Patient patient = new Patient();
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setEmail(request.getEmail());
        patient.setPhone(request.getPhone());
        patient.setDocumentId(request.getDocumentId());
        patient.setAddress(request.getAddress());
        patient.setBirthDate(request.getBirthDate());

        try {
            if (request.getGender() != null) {
                patient.setGender(Gender.valueOf(request.getGender().toUpperCase()));
            } else {
                patient.setGender(Gender.UNDISCLOSED);
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Género inválido. Valores permitidos: MALE, FEMALE, OTHER");
        }

        patient.setUser(user);

        patientRepository.save(patient);
    }
}