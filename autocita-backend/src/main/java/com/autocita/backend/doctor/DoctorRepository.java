package com.autocita.backend.doctor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Integer> {

    // BÚSQUEDAS POR CAMPOS ÚNICOS
    
    Optional<Doctor> findByUserUsername(String username);

    Optional<Doctor> findByUserId(Integer userId);

    Optional<Doctor> findByLicenseNumber(String licenseNumber);

    Optional<Doctor> findByEmail(String email);

    // BÚSQUEDAS DE NEGOCIO

    List<Doctor> findBySpecialty(Specialty specialty);

    List<Doctor> findByActiveTrue();

    List<Doctor> findBySpecialtyAndActiveTrue(Specialty specialty);

    // VALIDACIONES

    boolean existsByLicenseNumber(String licenseNumber);

    boolean existsByEmail(String email);

    @Query("SELECT d FROM Doctor d WHERE LOWER(d.firstName) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(d.lastName) LIKE LOWER(CONCAT('%', :term, '%'))")
    List<Doctor> searchByName(@Param("term") String term);
}
