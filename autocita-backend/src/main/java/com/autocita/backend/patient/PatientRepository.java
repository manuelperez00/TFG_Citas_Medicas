package com.autocita.backend.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Integer> {

    Optional<Patient> findByUserUsername(String username);

    Optional<Patient> findByDocumentId(String documentId);

    Optional<Patient> findByEmail(String email);

    boolean existsByDocumentId(String documentId);
    
    boolean existsByEmail(String email);
}
