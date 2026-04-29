package com.autocita.backend.patient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientRepository.findAll());
    }

    @GetMapping("/my-id")
    public ResponseEntity<Object> getMyPatientId(Authentication authentication) {
        String username = authentication.getName();

        return patientRepository.findByUserUsername(username)
                .map(patient -> ResponseEntity.ok((Object) patient.getId()))
                .orElseThrow(() -> new RuntimeException("El usuario " + username + " no tiene perfil de paciente."));
    }

    @GetMapping("/me")
    public ResponseEntity<Patient> getMyPatient(Authentication authentication) {
        String username = authentication.getName();
        System.out.println("getMyPatient called for user=" + username);

        return patientRepository.findByUserUsername(username)
                .map(patient -> {
                    System.out.println("Found patient id=" + patient.getId() + " for user=" + username);
                    return ResponseEntity.ok(patient);
                })
                .orElseGet(() -> {
                    System.out.println("Patient not found for user=" + username);
                    return ResponseEntity.notFound().build();
                });
    }

    @RequestMapping(value = "/me", method = { RequestMethod.PUT, RequestMethod.PATCH })
    public ResponseEntity<Patient> updateMyPatient(Authentication authentication, @RequestBody Patient incoming) {
        String username = authentication.getName();
        System.out.println("updateMyPatient called for user=" + username + " incoming=" + incoming);
        return patientRepository.findByUserUsername(username)
                .map(patient -> {
                    applyUpdateFields(patient, incoming);
                    Patient saved = patientRepository.save(patient);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/me")
    public ResponseEntity<Patient> updateMyPatientPost(Authentication authentication, @RequestBody Patient incoming) {
        return updateMyPatient(authentication, incoming);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Patient> updatePatientById(@PathVariable Integer id, Authentication authentication,
            @RequestBody Patient incoming) {
        String username = authentication.getName();
        return patientRepository.findById(id)
                .filter(patient -> patient.getUser().getUsername().equals(username))
                .map(patient -> {
                    applyUpdateFields(patient, incoming);
                    Patient saved = patientRepository.save(patient);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.status(403).build());
    }

    private void applyUpdateFields(Patient patient, Patient incoming) {
        if (incoming.getFirstName() != null)
            patient.setFirstName(incoming.getFirstName());
        if (incoming.getLastName() != null)
            patient.setLastName(incoming.getLastName());
        if (incoming.getEmail() != null)
            patient.setEmail(incoming.getEmail());
        if (incoming.getPhone() != null)
            patient.setPhone(incoming.getPhone());
        if (incoming.getAddress() != null)
            patient.setAddress(incoming.getAddress());
        if (incoming.getGender() != null)
            patient.setGender(incoming.getGender());
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Integer id) {
        return patientRepository.findById(id)
                .map(patient -> ResponseEntity.ok(patient))
                .orElse(ResponseEntity.notFound().build());
    }
}