package com.autocita.backend.appointment;

import com.autocita.backend.doctor.Doctor;
import com.autocita.backend.doctor.DoctorRepository;
import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.doctor.WorkShift;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.patient.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class AppointmentServiceTest {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    private Patient testPatient;
    private Doctor testDoctor;
    private Appointment testAppointment;

    @BeforeEach
    void setUp() {
        // Limpiar datos previos respetando constraints
        appointmentRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();

        // Crear paciente de prueba
        testPatient = new Patient();
        testPatient.setFirstName("Juan");
        testPatient.setLastName("Pérez");
        testPatient.setEmail("juan@example.com");
        testPatient.setPhone("123456789");
        testPatient.setBirthDate(LocalDate.of(1988, 6, 10));
        testPatient.setDocumentId("22222222B");
        testPatient = patientRepository.save(testPatient);

        // Crear doctor de prueba
        testDoctor = new Doctor();
        testDoctor.setFirstName("Dr. Carlos");
        testDoctor.setLastName("García");
        testDoctor.setSpecialty(Specialty.CARDIOLOGY);
        testDoctor.setWorkShift(WorkShift.MORNING);
        testDoctor.setEmail("doctor@example.com");
        testDoctor.setPhone("123456789");
        testDoctor.setLicenseNumber("MED-123456");
        testDoctor = doctorRepository.save(testDoctor);

        // Crear cita de prueba
        testAppointment = new Appointment();
        testAppointment.setPatient(testPatient);
        testAppointment.setDoctor(testDoctor);
        testAppointment.setStartTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0));
        testAppointment.setDurationMinutes(60);
        testAppointment.setStatus(AppointmentStatus.ASSIGNED);
        testAppointment = appointmentRepository.save(testAppointment);
    }

    @Test
    void testCreateAppointment() {
        Appointment appointment = new Appointment();
        appointment.setPatient(testPatient);
        appointment.setDoctor(testDoctor);
        appointment.setStartTime(LocalDateTime.now().plusDays(2).withHour(14).withMinute(0).withSecond(0));
        appointment.setDurationMinutes(60);
        appointment.setStatus(AppointmentStatus.ASSIGNED);

        Appointment saved = appointmentRepository.save(appointment);

        assertNotNull(saved.getId());
        assertEquals(AppointmentStatus.ASSIGNED, saved.getStatus());
        assertEquals(testPatient.getId(), saved.getPatient().getId());
        assertEquals(testDoctor.getId(), saved.getDoctor().getId());
    }

    @Test
    void testGetAppointmentsByPatient() {
        // Crear una segunda cita
        Appointment appointment2 = new Appointment();
        appointment2.setPatient(testPatient);
        appointment2.setDoctor(testDoctor);
        appointment2.setStartTime(LocalDateTime.now().plusDays(3).withHour(11).withMinute(0).withSecond(0));
        appointment2.setDurationMinutes(60);
        appointment2.setStatus(AppointmentStatus.ASSIGNED);
        appointmentRepository.save(appointment2);

        List<Appointment> appointments = appointmentRepository.findByPatientId(testPatient.getId());

        assertEquals(2, appointments.size());
        assertTrue(appointments.stream().allMatch(a -> a.getPatient().getId().equals(testPatient.getId())));
    }

    @Test
    void testCancelAppointment() {
        Integer appointmentId = testAppointment.getId();
        testAppointment.setStatus(AppointmentStatus.REJECTED);
        appointmentRepository.save(testAppointment);

        Appointment cancelled = appointmentRepository.findById(appointmentId).orElse(null);

        assertNotNull(cancelled);
        assertEquals(AppointmentStatus.REJECTED, cancelled.getStatus());
    }

    @Test
    void testAppointmentStatusTransition() {
        // De ASSIGNED a OFFERED
        testAppointment.setStatus(AppointmentStatus.OFFERED);
        appointmentRepository.save(testAppointment);

        Appointment updated = appointmentRepository.findById(testAppointment.getId()).orElse(null);
        assertEquals(AppointmentStatus.OFFERED, updated.getStatus());

        // De OFFERED a ASSIGNED
        updated.setStatus(AppointmentStatus.ASSIGNED);
        appointmentRepository.save(updated);

        Appointment finalState = appointmentRepository.findById(testAppointment.getId()).orElse(null);
        assertEquals(AppointmentStatus.ASSIGNED, finalState.getStatus());
    }

    @Test
    void testMultipleAppointmentsSamePatient() {
        // Crear otra cita para el mismo paciente
        Appointment appointment2 = new Appointment();
        appointment2.setPatient(testPatient);
        appointment2.setDoctor(testDoctor);
        appointment2.setStartTime(LocalDateTime.now().plusHours(2));
        appointment2.setDurationMinutes(60);
        appointment2.setStatus(AppointmentStatus.ASSIGNED);
        appointmentRepository.save(appointment2);

        List<Appointment> appointments = appointmentRepository.findByPatientId(testPatient.getId());

        assertEquals(2, appointments.size());
        assertTrue(appointments.stream()
                .allMatch(a -> a.getPatient().getId().equals(testPatient.getId())));
    }

    @Test
    void testIsWithinDoctorShift_MorningShift_ValidHours() {
        // Pruebas dentro del turno de mañana (09:00-13:59)
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(9).withMinute(0), WorkShift.MORNING));
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(10).withMinute(30), WorkShift.MORNING));
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(13).withMinute(59), WorkShift.MORNING));
    }

    @Test
    void testIsWithinDoctorShift_MorningShift_InvalidHours() {
        // Pruebas fuera del turno de mañana
        assertFalse(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(8).withMinute(59), WorkShift.MORNING));
        assertFalse(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(14).withMinute(0), WorkShift.MORNING));
        assertFalse(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(16).withMinute(0), WorkShift.MORNING));
    }

    @Test
    void testIsWithinDoctorShift_AfternoonShift_ValidHours() {
        // Pruebas dentro del turno de tarde (16:00-20:59)
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(16).withMinute(0), WorkShift.AFTERNOON));
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(18).withMinute(30), WorkShift.AFTERNOON));
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(20).withMinute(59), WorkShift.AFTERNOON));
    }

    @Test
    void testIsWithinDoctorShift_AfternoonShift_InvalidHours() {
        // Pruebas fuera del turno de tarde
        assertFalse(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(9).withMinute(0), WorkShift.AFTERNOON));
        assertFalse(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(15).withMinute(59), WorkShift.AFTERNOON));
        assertFalse(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(21).withMinute(0), WorkShift.AFTERNOON));
    }

    @Test
    void testIsWithinDoctorShift_AnyShift() {
        // El turno ANY siempre debe retornar true para cualquier hora
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(0).withMinute(0), WorkShift.ANY));
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(12).withMinute(0), WorkShift.ANY));
        assertTrue(AppointmentService.isWithinDoctorShift(
                LocalDateTime.now().withHour(23).withMinute(59), WorkShift.ANY));
    }

    @Test
    void testHasTimeOverlap_CompleteOverlap() {
        // Cita 1: 10:00-11:00, Cita 2: 10:15-10:45 (completamente superpuesta)
        LocalDateTime start1 = LocalDateTime.now().withHour(10).withMinute(0);
        LocalDateTime start2 = LocalDateTime.now().withHour(10).withMinute(15);
        assertTrue(AppointmentService.hasTimeOverlap(start1, 60, start2, 30));
    }

    @Test
    void testHasTimeOverlap_PartialOverlap() {
        // Cita 1: 10:00-11:00, Cita 2: 10:30-11:30 (parcialmente superpuesta)
        LocalDateTime start1 = LocalDateTime.now().withHour(10).withMinute(0);
        LocalDateTime start2 = LocalDateTime.now().withHour(10).withMinute(30);
        assertTrue(AppointmentService.hasTimeOverlap(start1, 60, start2, 60));
    }

    @Test
    void testHasTimeOverlap_TouchingButNotOverlapping() {
        // Cita 1: 10:00-11:00, Cita 2: 11:00-12:00 (se tocan pero no se solapan)
        LocalDateTime start1 = LocalDateTime.now().withHour(10).withMinute(0);
        LocalDateTime start2 = LocalDateTime.now().withHour(11).withMinute(0);
        assertFalse(AppointmentService.hasTimeOverlap(start1, 60, start2, 60));
    }

    @Test
    void testHasTimeOverlap_NoOverlap() {
        // Cita 1: 10:00-11:00, Cita 2: 14:00-15:00 (sin solapamiento)
        LocalDateTime start1 = LocalDateTime.now().withHour(10).withMinute(0);
        LocalDateTime start2 = LocalDateTime.now().withHour(14).withMinute(0);
        assertFalse(AppointmentService.hasTimeOverlap(start1, 60, start2, 60));
    }

    @Test
    void testHasTimeOverlap_ReversedOrder() {
        // Cita 2 antes que cita 1, pero con solapamiento
        LocalDateTime start1 = LocalDateTime.now().withHour(11).withMinute(0);
        LocalDateTime start2 = LocalDateTime.now().withHour(10).withMinute(30);
        assertTrue(AppointmentService.hasTimeOverlap(start1, 60, start2, 60));
    }

    @Test
    void testHasTimeOverlap_SameDuration() {
        // Dos citas exactamente al mismo tiempo
        LocalDateTime start = LocalDateTime.now().withHour(10).withMinute(0);
        assertTrue(AppointmentService.hasTimeOverlap(start, 60, start, 60));
    }

    @Test
    void testAppointmentWithDifferentDoctors() {
        // Crear otro doctor de diferente especialidad
        Doctor otherDoctor = new Doctor();
        otherDoctor.setFirstName("Dra. María");
        otherDoctor.setLastName("López");
        otherDoctor.setSpecialty(Specialty.GYNECOLOGY);
        otherDoctor.setWorkShift(WorkShift.AFTERNOON);
        otherDoctor.setEmail("maria@example.com");
        otherDoctor.setPhone("987654321");
        otherDoctor.setLicenseNumber("MED-654321");
        otherDoctor = doctorRepository.save(otherDoctor);

        // Crear cita con otro doctor
        Appointment appointment2 = new Appointment();
        appointment2.setPatient(testPatient);
        appointment2.setDoctor(otherDoctor);
        appointment2.setStartTime(LocalDateTime.now().plusDays(2).withHour(17).withMinute(0).withSecond(0));
        appointment2.setDurationMinutes(45);
        appointment2.setStatus(AppointmentStatus.ASSIGNED);
        appointmentRepository.save(appointment2);

        List<Appointment> allAppointments = appointmentRepository.findByPatientId(testPatient.getId());
        assertEquals(2, allAppointments.size());

        // Verificar que están con doctores diferentes
        assertTrue(allAppointments.stream().map(a -> a.getDoctor().getId()).distinct().count() >= 2);
    }

    @Test
    void testAppointmentStatusToOffered() {
        testAppointment.setStatus(AppointmentStatus.OFFERED);
        appointmentRepository.save(testAppointment);

        Appointment found = appointmentRepository.findById(testAppointment.getId()).orElse(null);
        assertNotNull(found);
        assertEquals(AppointmentStatus.OFFERED, found.getStatus());
    }

    @Test
    void testAppointmentStatusToAvailable() {
        testAppointment.setStatus(AppointmentStatus.AVAILABLE);
        testAppointment.setPatient(null);
        appointmentRepository.save(testAppointment);

        Appointment found = appointmentRepository.findById(testAppointment.getId()).orElse(null);
        assertNotNull(found);
        assertEquals(AppointmentStatus.AVAILABLE, found.getStatus());
        assertNull(found.getPatient());
    }

    @Test
    void testAppointmentDurationVariations() {
        // Crear cita con duración diferente
        Appointment shortAppointment = new Appointment();
        shortAppointment.setPatient(testPatient);
        shortAppointment.setDoctor(testDoctor);
        shortAppointment.setStartTime(LocalDateTime.now().plusDays(3).withHour(15).withMinute(0).withSecond(0));
        shortAppointment.setDurationMinutes(15); // Cita corta
        shortAppointment.setStatus(AppointmentStatus.ASSIGNED);
        shortAppointment = appointmentRepository.save(shortAppointment);

        Appointment longAppointment = new Appointment();
        longAppointment.setPatient(testPatient);
        longAppointment.setDoctor(testDoctor);
        longAppointment.setStartTime(LocalDateTime.now().plusDays(4).withHour(15).withMinute(0).withSecond(0));
        longAppointment.setDurationMinutes(120); // Cita larga
        longAppointment.setStatus(AppointmentStatus.ASSIGNED);
        longAppointment = appointmentRepository.save(longAppointment);

        Appointment foundShort = appointmentRepository.findById(shortAppointment.getId()).orElse(null);
        Appointment foundLong = appointmentRepository.findById(longAppointment.getId()).orElse(null);

        assertEquals(15, foundShort.getDurationMinutes());
        assertEquals(120, foundLong.getDurationMinutes());
    }

    @Test
    void testAppointmentNotesField() {
        testAppointment.setNotes("Paciente requiere análisis de sangre previos");
        appointmentRepository.save(testAppointment);

        Appointment found = appointmentRepository.findById(testAppointment.getId()).orElse(null);
        assertNotNull(found);
        assertEquals("Paciente requiere análisis de sangre previos", found.getNotes());
    }

    @Test
    void testAppointmentReassignedFlag() {
        assertFalse(testAppointment.isReassigned());

        testAppointment.setReassigned(true);
        appointmentRepository.save(testAppointment);

        Appointment found = appointmentRepository.findById(testAppointment.getId()).orElse(null);
        assertTrue(found.isReassigned());
    }

    @Test
    void testGetAppointmentsByDoctor() {
        // Crear otra cita para el mismo doctor
        Appointment appointment2 = new Appointment();
        appointment2.setPatient(testPatient);
        appointment2.setDoctor(testDoctor);
        appointment2.setStartTime(LocalDateTime.now().plusDays(5).withHour(10).withMinute(0).withSecond(0));
        appointment2.setDurationMinutes(60);
        appointment2.setStatus(AppointmentStatus.ASSIGNED);
        appointmentRepository.save(appointment2);

        // Buscar citas del doctor (si hay método findByDoctorId)
        List<Appointment> allAppointments = appointmentRepository.findAll();
        List<Appointment> doctorAppointments = allAppointments.stream()
                .filter(a -> a.getDoctor().getId().equals(testDoctor.getId()))
                .toList();

        assertTrue(doctorAppointments.size() >= 2);
    }

    @Test
    void testAppointmentWithFutureDate() {
        LocalDateTime futureDate = LocalDateTime.now().plusDays(30);
        Appointment futureAppointment = new Appointment();
        futureAppointment.setPatient(testPatient);
        futureAppointment.setDoctor(testDoctor);
        futureAppointment.setStartTime(futureDate);
        futureAppointment.setDurationMinutes(60);
        futureAppointment.setStatus(AppointmentStatus.ASSIGNED);
        futureAppointment = appointmentRepository.save(futureAppointment);

        Appointment found = appointmentRepository.findById(futureAppointment.getId()).orElse(null);
        assertTrue(found.getStartTime().isAfter(LocalDateTime.now().plusDays(29)));
    }

    @Test
    void testMultipleDoctorsMultiplePatients() {
        // Crear segundo paciente
        Patient patient2 = new Patient();
        patient2.setFirstName("Ana");
        patient2.setLastName("García");
        patient2.setEmail("ana@example.com");
        patient2.setPhone("999888777");
        patient2.setBirthDate(LocalDate.of(1992, 3, 15));
        patient2.setDocumentId("33333333C");
        patient2 = patientRepository.save(patient2);

        // Crear segundo doctor
        Doctor doctor2 = new Doctor();
        doctor2.setFirstName("Dr. Juan");
        doctor2.setLastName("Rodríguez");
        doctor2.setSpecialty(Specialty.DERMATOLOGY);
        doctor2.setWorkShift(WorkShift.AFTERNOON);
        doctor2.setEmail("juan@example.com");
        doctor2.setPhone("555666777");
        doctor2.setLicenseNumber("MED-789012");
        doctor2 = doctorRepository.save(doctor2);

        // Crear cita con nueva combinación
        Appointment appointment = new Appointment();
        appointment.setPatient(patient2);
        appointment.setDoctor(doctor2);
        appointment.setStartTime(LocalDateTime.now().plusDays(7).withHour(17).withMinute(0).withSecond(0));
        appointment.setDurationMinutes(60);
        appointment.setStatus(AppointmentStatus.ASSIGNED);
        appointmentRepository.save(appointment);

        List<Appointment> totalAppointments = appointmentRepository.findAll();
        assertEquals(2, totalAppointments.size());

        List<Appointment> patient2Appointments = appointmentRepository.findByPatientId(patient2.getId());
        assertEquals(1, patient2Appointments.size());
    }
}
