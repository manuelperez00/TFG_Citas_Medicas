package com.autocita.backend.reassignmentLog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReassignmentLogRepository extends JpaRepository<ReassignmentLog, Integer> {

    List<ReassignmentLog> findByAppointmentId(Integer appointmentId);

    List<ReassignmentLog> findByNewPatientId(Integer patientId);

    List<ReassignmentLog> findByOriginalPatientId(Integer patientId);

    // Buscar pacientes que rechazaron o no respondieron a esta cita
    @Query("SELECT l.newPatient.id FROM ReassignmentLog l WHERE l.appointment.id = :appId AND (l.reason = 'OFERTA_RECHAZADA' OR l.reason = 'NOT_RESPONDED')")
    List<Integer> findRejectedPatientIdsByAppointment(@Param("appId") Integer appId);

    @Query("SELECT l FROM ReassignmentLog l WHERE l.appointment.doctor.id = :doctorId ORDER BY l.timestamp DESC")
    List<ReassignmentLog> findByAppointmentDoctorId(@Param("doctorId") Integer doctorId);

    @Query("SELECT COUNT(l) FROM ReassignmentLog l WHERE l.appointment.doctor.id = :doctorId AND l.reason = :reason")
    long countByAppointmentDoctorIdAndReason(@Param("doctorId") Integer doctorId, @Param("reason") String reason);
}