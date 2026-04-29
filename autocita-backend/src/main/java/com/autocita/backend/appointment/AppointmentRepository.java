package com.autocita.backend.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

        // Encontrar huecos libres de un médico específico en un rango de fechas
        @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.startTime BETWEEN :start AND :end")
        List<Appointment> findByDoctorAndDateRange(
                        @Param("doctorId") Integer doctorId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // Encontrar TODOS los huecos libres de una especialidad (Para reasignación manual o consulta)
        // Buscamos citas 'AVAILABLE' de médicos que tengan la especialidad 'X'
        @Query("SELECT a FROM Appointment a WHERE a.status = 'AVAILABLE' AND a.doctor.specialty = :specialty")
        List<Appointment> findAvailableBySpecialty(@Param("specialty") com.autocita.backend.doctor.Specialty specialty);

        @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.status = 'BLOCKED'")
        List<Appointment> findBlockedByDoctor(@Param("doctorId") Integer doctorId);

        List<Appointment> findByDoctorIdAndStatusIn(Long doctorId, List<AppointmentStatus> statuses);

        @EntityGraph(attributePaths = { "doctor", "patient" })
        List<Appointment> findByPatientId(Integer patientId);

        @EntityGraph(attributePaths = { "doctor", "patient" })
        List<Appointment> findByDoctorId(Integer doctorId);

        List<Appointment> findByStatusAndOfferedAtBefore(AppointmentStatus status, LocalDateTime dateTime);

        Optional<Appointment> findByDoctorIdAndStartTime(Integer doctorId, LocalDateTime startTime);

        boolean existsByDoctorIdAndStartTime(Integer doctorId, java.time.LocalDateTime startTime);

        boolean existsByDoctorIdAndStartTimeAndStatus(Integer doctorId, java.time.LocalDateTime startTime,
                        AppointmentStatus status);

        boolean existsByPatientIdAndStartTime(Integer patientId, java.time.LocalDateTime startTime);

        // Verificar si un paciente ya tiene una cita de la misma
        // especialidad en un día específico
        @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Appointment a " +
                        "WHERE a.patient.id = :patientId " +
                        "AND a.doctor.specialty = :specialty " +
                        "AND CAST(a.startTime AS date) = :date " +
                        "AND a.status IN ('ASSIGNED', 'OFFERED')")
        boolean hasAppointmentSameDateAndSpecialty(
                        @Param("patientId") Integer patientId,
                        @Param("specialty") com.autocita.backend.doctor.Specialty specialty,
                        @Param("date") java.time.LocalDate date);

        // Obtener todas las citas de un paciente en un día específico (sin
        // importar especialidad)
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.patient.id = :patientId " +
                        "AND CAST(a.startTime AS date) = :date " +
                        "AND a.status IN ('ASSIGNED', 'OFFERED') " +
                        "ORDER BY a.startTime")
        List<Appointment> findPatientAppointmentsByDate(
                        @Param("patientId") Integer patientId,
                        @Param("date") java.time.LocalDate date);

        // Contadores para estadísticas rápidas
        long countByDoctorIdAndStatus(Integer doctorId, AppointmentStatus status);

        long countByDoctorIdAndStatusIn(Integer doctorId, List<AppointmentStatus> statuses);

        // MEJORADO: Buscar cita por doctor+hora EXCLUYENDO estados inactivos (REJECTED)
        @Query("SELECT a FROM Appointment a " +
                        "WHERE a.doctor.id = :doctorId " +
                        "AND a.startTime = :startTime " +
                        "AND a.status NOT IN ('REJECTED') " +
                        "ORDER BY a.id DESC LIMIT 1")
        Optional<Appointment> findByDoctorIdAndStartTimeActiveOnly(
                        @Param("doctorId") Integer doctorId,
                        @Param("startTime") LocalDateTime startTime);
}