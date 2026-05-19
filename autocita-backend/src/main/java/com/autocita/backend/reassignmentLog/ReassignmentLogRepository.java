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

    // Excluidos en primera ronda: rechazaron explícitamente O no respondieron (pasarán a segunda vuelta)
    @Query("SELECT l.newPatient.id FROM ReassignmentLog l WHERE l.appointment.id = :appId AND (l.reason = 'OFERTA_RECHAZADA' OR l.reason = 'NOT_RESPONDED')")
    List<Integer> findRejectedPatientIdsByAppointment(@Param("appId") Integer appId);

    // Candidatos que NO respondieron en R1, en el orden en que el algoritmo los intentó (para segunda vuelta)
    @Query("SELECT l.newPatient FROM ReassignmentLog l WHERE l.appointment.id = :appId AND l.reason = 'NOT_RESPONDED' ORDER BY l.timestamp ASC")
    List<com.autocita.backend.patient.Patient> findNotRespondedPatientsOrdered(@Param("appId") Integer appId);

    // Candidatos ya descartados definitivamente en segunda vuelta (rechazaron o tampoco respondieron)
    @Query("SELECT l.newPatient.id FROM ReassignmentLog l WHERE l.appointment.id = :appId AND (l.reason = 'OFERTA_RECHAZADA_R2' OR l.reason = 'NOT_RESPONDED_R2')")
    List<Integer> findSecondRoundExcludedIds(@Param("appId") Integer appId);

    @Query("SELECT l FROM ReassignmentLog l WHERE l.appointment.doctor.id = :doctorId ORDER BY l.timestamp DESC")
    List<ReassignmentLog> findByAppointmentDoctorId(@Param("doctorId") Integer doctorId);

    @Query("SELECT COUNT(l) FROM ReassignmentLog l WHERE l.appointment.doctor.id = :doctorId AND l.reason = :reason")
    long countByAppointmentDoctorIdAndReason(@Param("doctorId") Integer doctorId, @Param("reason") String reason);
}