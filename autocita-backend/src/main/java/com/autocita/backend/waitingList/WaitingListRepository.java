package com.autocita.backend.waitingList;

import com.autocita.backend.doctor.Specialty;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface WaitingListRepository extends JpaRepository<WaitingList, Integer> {

        List<WaitingList> findBySpecialty(Specialty specialty);

        // Evitar que un paciente se apunte dos veces a la misma lista
        boolean existsByPatientIdAndSpecialty(Integer patientId, Specialty specialty);

        // Buscar todas las solicitudes de un paciente
        List<WaitingList> findByPatientId(Integer patientId);

        @Query("SELECT w FROM WaitingList w WHERE w.patient.id = :patientId AND w.status = 'ACTIVE'")
        List<WaitingList> findActiveByPatientId(@Param("patientId") Integer patientId);

        @Query("SELECT w FROM WaitingList w WHERE w.status = :status ORDER BY w.preferredDate DESC")
        List<WaitingList> findByStatus(@Param("status") WaitingListStatus status);

        @Query("SELECT w FROM WaitingList w WHERE w.patient.id = :patientId AND w.status = 'EXPIRED'")
        List<WaitingList> findExpiredByPatientId(@Param("patientId") Integer patientId);

        // Contar cuántas solicitudes tiene un paciente con fecha de solicitud "hoy"
        @Query("SELECT COUNT(w) FROM WaitingList w WHERE w.patient.id = :patientId AND CAST(w.requestDate AS date) = :today")
        long countByPatientIdAndRequestDateToday(@Param("patientId") Integer patientId,
                        @Param("today") LocalDate today);

        // Eliminar solicitudes futuras de la misma especialidad después de una fecha aceptada
        @Modifying
        @Query("DELETE FROM WaitingList w WHERE w.patient.id = :patientId AND w.specialty = :specialty AND w.preferredDate > :acceptedDate")
        @Transactional
        void deleteByPatientIdAndSpecialtyAfterDate(@Param("patientId") Integer patientId,
                        @Param("specialty") Specialty specialty,
                        @Param("acceptedDate") LocalDate acceptedDate);

        @Transactional
        void deleteByPatientIdAndSpecialty(Integer patientId, Specialty specialty);
}