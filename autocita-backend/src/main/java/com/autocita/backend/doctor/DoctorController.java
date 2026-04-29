package com.autocita.backend.doctor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;

    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/my-id")
    public ResponseEntity<Object> getMyDoctorId(Authentication authentication) {
        String username = authentication.getName();
        return doctorRepository.findByUserUsername(username)
                .map(doctor -> {
                    System.out.println("getMyDoctorId called for user=" + username + " doctor.id=" + doctor.getId()
                            + " user.id=" + (doctor.getUser() != null ? doctor.getUser().getId() : "null"));
                    return ResponseEntity.ok((Object) doctor.getId());
                })
                .orElseThrow(
                        () -> new RuntimeException("El usuario " + username + " no tiene perfil de médico asignado."));
    }

    @GetMapping("/me")
    public ResponseEntity<Doctor> getMyDoctor(Authentication authentication) {
        String username = authentication.getName();
        System.out.println("getMyDoctor called for user=" + username);

        return doctorRepository.findByUserUsername(username)
                .map(doctor -> ResponseEntity.ok(doctor))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @RequestMapping(value = "/me", method = { RequestMethod.PUT, RequestMethod.PATCH })
    public ResponseEntity<Doctor> updateMyDoctor(Authentication authentication, @RequestBody Doctor incoming) {
        String username = authentication.getName();
        System.out.println("updateMyDoctor called for user=" + username + " incoming=" + incoming);

        return doctorRepository.findByUserUsername(username)
                .map(doc -> {
                    applyUpdateFields(doc, incoming);
                    Doctor saved = doctorRepository.save(doc);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/me")
    public ResponseEntity<Doctor> updateMyDoctorPost(Authentication authentication, @RequestBody Doctor incoming) {
        return updateMyDoctor(authentication, incoming);
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Doctor> updateDoctorById(@PathVariable Integer id, Authentication authentication,
            @RequestBody Doctor incoming) {
        String username = authentication.getName();
        return doctorRepository.findById(id)
                .filter(doc -> doc.getUser().getUsername().equals(username))
                .map(doc -> {
                    applyUpdateFields(doc, incoming);
                    Doctor saved = doctorRepository.save(doc);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.status(403).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Integer id) {
        System.out.println("getDoctorById requested id=" + id);
        return doctorRepository.findById(id)
                .map(doc -> {
                    System.out.println("found doctor with id=" + doc.getId() + " (userId="
                            + (doc.getUser() != null ? doc.getUser().getId() : "null") + ")");
                    return ResponseEntity.ok(doc);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void applyUpdateFields(Doctor doctor, Doctor incoming) {
        if (incoming.getFirstName() != null)
            doctor.setFirstName(incoming.getFirstName());
        if (incoming.getLastName() != null)
            doctor.setLastName(incoming.getLastName());
        if (incoming.getEmail() != null)
            doctor.setEmail(incoming.getEmail());
        if (incoming.getPhone() != null)
            doctor.setPhone(incoming.getPhone());
        if (incoming.getWorkShift() != null)
            doctor.setWorkShift(incoming.getWorkShift());
    }

}