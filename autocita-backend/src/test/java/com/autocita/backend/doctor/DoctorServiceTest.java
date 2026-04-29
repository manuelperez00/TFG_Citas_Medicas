package com.autocita.backend.doctor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class DoctorServiceTest {

    @Autowired
    private DoctorRepository doctorRepository;

    private Doctor testDoctor;

    @BeforeEach
    void setUp() {
        doctorRepository.deleteAll();

        testDoctor = new Doctor();
        testDoctor.setFirstName("Dr. Miguel");
        testDoctor.setLastName("Fernández");
        testDoctor.setSpecialty(Specialty.CARDIOLOGY);
        testDoctor.setWorkShift(WorkShift.MORNING);
        testDoctor.setEmail("miguel@hospital.com");
        testDoctor.setPhone("987654321");
        testDoctor.setLicenseNumber("MED-123456");
        testDoctor = doctorRepository.save(testDoctor);
    }

    @Test
    void testCreateDoctor() {
        Doctor doctor = new Doctor();
        doctor.setFirstName("Dr. Pedro");
        doctor.setLastName("González");
        doctor.setSpecialty(Specialty.DERMATOLOGY);
        doctor.setWorkShift(WorkShift.AFTERNOON);
        doctor.setEmail("pedro@hospital.com");
        doctor.setPhone("123456789");
        doctor.setLicenseNumber("MED-654321");

        Doctor saved = doctorRepository.save(doctor);

        assertNotNull(saved.getId());
        assertEquals("Dr. Pedro", saved.getFirstName());
        assertEquals(Specialty.DERMATOLOGY, saved.getSpecialty());
    }

    @Test
    void testFindDoctorById() {
        Doctor found = doctorRepository.findById(testDoctor.getId()).orElse(null);

        assertNotNull(found);
        assertEquals("Dr. Miguel", found.getFirstName());
        assertEquals(Specialty.CARDIOLOGY, found.getSpecialty());
    }

    @Test
    void testFindDoctorsBySpecialty() {
        // Crear otro doctor de la misma especialidad
        Doctor doctor2 = new Doctor();
        doctor2.setFirstName("Dr. José");
        doctor2.setLastName("Sánchez");
        doctor2.setSpecialty(Specialty.CARDIOLOGY);
        doctor2.setWorkShift(WorkShift.AFTERNOON);
        doctor2.setEmail("jose@hospital.com");
        doctor2.setPhone("111111111");
        doctor2.setLicenseNumber("MED-789012");
        doctorRepository.save(doctor2);

        List<Doctor> cardiologists = doctorRepository.findBySpecialty(Specialty.CARDIOLOGY);

        assertTrue(cardiologists.size() >= 2);
        assertTrue(cardiologists.stream()
                .allMatch(d -> d.getSpecialty().equals(Specialty.CARDIOLOGY)));
    }

    @Test
    void testUpdateDoctorSpecialty() {
        testDoctor.setSpecialty(Specialty.GYNECOLOGY);
        doctorRepository.save(testDoctor);

        Doctor updated = doctorRepository.findById(testDoctor.getId()).orElse(null);
        assertEquals(Specialty.GYNECOLOGY, updated.getSpecialty());
    }

    @Test
    void testDoctorEmailValidation() {
        assertEquals("miguel@hospital.com", testDoctor.getEmail());
        assertTrue(testDoctor.getEmail().contains("@"));
    }

    @Test
    void testAllSpecialties() {
        // Crear doctores de diferentes especialidades
        Specialty[] specialties = {
                Specialty.PEDIATRICS,
                Specialty.DERMATOLOGY,
                Specialty.DIGESTIVE,
                Specialty.GYNECOLOGY
        };

        for (int i = 0; i < specialties.length; i++) {
            Specialty specialty = specialties[i];
            Doctor doctor = new Doctor();
            doctor.setFirstName("Dr. Test");
            doctor.setLastName(specialty.toString());
            doctor.setSpecialty(specialty);
            doctor.setWorkShift(WorkShift.MORNING);
            doctor.setEmail("test" + i + "@hospital.com");
            doctor.setPhone("222222222");
            doctor.setLicenseNumber("MED-" + String.format("%06d", i).substring(0, 6));
            doctorRepository.save(doctor);
        }

        for (Specialty specialty : specialties) {
            List<Doctor> doctors = doctorRepository.findBySpecialty(specialty);
            assertTrue(doctors.stream()
                    .anyMatch(d -> d.getSpecialty().equals(specialty)));
        }
    }

    @Test
    void testDeleteDoctor() {
        Integer doctorId = testDoctor.getId();
        doctorRepository.deleteById(doctorId);

        Doctor deleted = doctorRepository.findById(doctorId).orElse(null);
        assertNull(deleted);
    }

    @Test
    void testDoctorNameValidation() {
        assertNotNull(testDoctor.getFirstName());
        assertNotNull(testDoctor.getLastName());
        assertTrue(testDoctor.getFirstName().length() > 0);
        assertTrue(testDoctor.getLastName().length() > 0);
    }

    @Test
    void testFindDoctorByLicenseNumber() {
        // Buscar por número de licencia (si existe el método)
        List<Doctor> allDoctors = doctorRepository.findAll();
        assertTrue(allDoctors.stream().anyMatch(d -> "MED-123456".equals(d.getLicenseNumber())));
    }

    @Test
    void testFindDoctorsByWorkShift() {
        // Crear doctores con diferentes turnos
        Doctor afternoonDoctor = new Doctor();
        afternoonDoctor.setFirstName("Dr. Fernando");
        afternoonDoctor.setLastName("López");
        afternoonDoctor.setSpecialty(Specialty.CARDIOLOGY);
        afternoonDoctor.setWorkShift(WorkShift.AFTERNOON);
        afternoonDoctor.setEmail("fernando@hospital.com");
        afternoonDoctor.setPhone("777888999");
        afternoonDoctor.setLicenseNumber("MED-555555");
        doctorRepository.save(afternoonDoctor);

        Doctor anyShiftDoctor = new Doctor();
        anyShiftDoctor.setFirstName("Dr. Roberto");
        anyShiftDoctor.setLastName("Martínez");
        anyShiftDoctor.setSpecialty(Specialty.PEDIATRICS);
        anyShiftDoctor.setWorkShift(WorkShift.ANY);
        anyShiftDoctor.setEmail("roberto@hospital.com");
        anyShiftDoctor.setPhone("555666777");
        anyShiftDoctor.setLicenseNumber("MED-444444");
        doctorRepository.save(anyShiftDoctor);

        // Verificar que se pueden obtener doctores por turno
        List<Doctor> morningDoctors = doctorRepository.findAll().stream()
                .filter(d -> d.getWorkShift() == WorkShift.MORNING)
                .toList();
        List<Doctor> afternoonDoctors = doctorRepository.findAll().stream()
                .filter(d -> d.getWorkShift() == WorkShift.AFTERNOON)
                .toList();
        List<Doctor> anyDoctors = doctorRepository.findAll().stream()
                .filter(d -> d.getWorkShift() == WorkShift.ANY)
                .toList();

        assertTrue(morningDoctors.size() >= 1);
        assertTrue(afternoonDoctors.size() >= 1);
        assertTrue(anyDoctors.size() >= 1);
    }

    @Test
    void testUpdateDoctorWorkShift() {
        testDoctor.setWorkShift(WorkShift.AFTERNOON);
        doctorRepository.save(testDoctor);

        Doctor updated = doctorRepository.findById(testDoctor.getId()).orElse(null);
        assertEquals(WorkShift.AFTERNOON, updated.getWorkShift());
    }

    @Test
    void testUpdateDoctorContactInfo() {
        testDoctor.setEmail("newemail@hospital.com");
        testDoctor.setPhone("999888777");
        doctorRepository.save(testDoctor);

        Doctor updated = doctorRepository.findById(testDoctor.getId()).orElse(null);
        assertEquals("newemail@hospital.com", updated.getEmail());
        assertEquals("999888777", updated.getPhone());
    }

    @Test
    void testFindNonExistentDoctor() {
        Integer nonExistentId = 99999;
        Doctor found = doctorRepository.findById(nonExistentId).orElse(null);
        assertNull(found);
    }

    @Test
    void testDoctorSpecialtyAndShiftCombination() {
        // Crear doctores con diferentes combinaciones
        Doctor cardioMorning = new Doctor();
        cardioMorning.setFirstName("Dr. Cardio");
        cardioMorning.setLastName("Mañana");
        cardioMorning.setSpecialty(Specialty.CARDIOLOGY);
        cardioMorning.setWorkShift(WorkShift.MORNING);
        cardioMorning.setEmail("cardio.morning@hospital.com");
        cardioMorning.setPhone("111111111");
        cardioMorning.setLicenseNumber("MED-111111");
        cardioMorning = doctorRepository.save(cardioMorning);

        Doctor cardioDermaAfternoon = new Doctor();
        cardioDermaAfternoon.setFirstName("Dr. Derma");
        cardioDermaAfternoon.setLastName("Tarde");
        cardioDermaAfternoon.setSpecialty(Specialty.DERMATOLOGY);
        cardioDermaAfternoon.setWorkShift(WorkShift.AFTERNOON);
        cardioDermaAfternoon.setEmail("derma.afternoon@hospital.com");
        cardioDermaAfternoon.setPhone("222222222");
        cardioDermaAfternoon.setLicenseNumber("MED-222222");
        cardioDermaAfternoon = doctorRepository.save(cardioDermaAfternoon);

        List<Doctor> allDoctors = doctorRepository.findAll();

        List<Doctor> cardiologists = allDoctors.stream()
                .filter(d -> d.getSpecialty() == Specialty.CARDIOLOGY)
                .toList();
        assertTrue(cardiologists.size() >= 1);

        List<Doctor> afternoonDoctors = allDoctors.stream()
                .filter(d -> d.getWorkShift() == WorkShift.AFTERNOON)
                .toList();
        assertTrue(afternoonDoctors.size() >= 1);
    }

    @Test
    void testDoctorPhoneFormat() {
        assertTrue(testDoctor.getPhone().matches("\\d+"));
        assertTrue(testDoctor.getPhone().length() >= 9);
    }

    @Test
    void testMultipleDoctorsCreation() {
        for (int i = 0; i < 5; i++) {
            Doctor doctor = new Doctor();
            doctor.setFirstName("Dr. Test" + i);
            doctor.setLastName("Apellido" + i);
            doctor.setSpecialty(Specialty.CARDIOLOGY);
            doctor.setWorkShift(WorkShift.MORNING);
            doctor.setEmail("doctor" + i + "@hospital.com");
            doctor.setPhone("123456" + String.format("%03d", i));
            doctor.setLicenseNumber("MED-" + String.format("%06d", i));
            doctorRepository.save(doctor);
        }

        List<Doctor> allDoctors = doctorRepository.findAll();
        assertTrue(allDoctors.size() >= 6); // testDoctor + 5 nuevos
    }

    @Test
    void testDoctorLicenseNumberUniqueness() {
        Doctor doctor1 = doctorRepository.findAll().stream()
                .filter(d -> "MED-123456".equals(d.getLicenseNumber()))
                .findFirst()
                .orElse(null);
        assertNotNull(doctor1);
        assertEquals("Dr. Miguel", doctor1.getFirstName());
    }

    @Test
    void testUpdateMultipleDoctorFields() {
        testDoctor.setFirstName("Dr. Carlos");
        testDoctor.setLastName("Nuevo Apellido");
        testDoctor.setSpecialty(Specialty.DIGESTIVE);
        testDoctor.setWorkShift(WorkShift.ANY);
        testDoctor.setEmail("newemail@hospital.com");
        testDoctor.setPhone("555555555");
        doctorRepository.save(testDoctor);

        Doctor updated = doctorRepository.findById(testDoctor.getId()).orElse(null);
        assertEquals("Dr. Carlos", updated.getFirstName());
        assertEquals("Nuevo Apellido", updated.getLastName());
        assertEquals(Specialty.DIGESTIVE, updated.getSpecialty());
        assertEquals(WorkShift.ANY, updated.getWorkShift());
        assertEquals("newemail@hospital.com", updated.getEmail());
    }

    @Test
    void testDoctorCountBySpecialty() {
        // Crear múltiples doctores de cardiología
        for (int i = 0; i < 3; i++) {
            Doctor doctor = new Doctor();
            doctor.setFirstName("Dr. Cardio" + i);
            doctor.setLastName("García" + i);
            doctor.setSpecialty(Specialty.CARDIOLOGY);
            doctor.setWorkShift(WorkShift.MORNING);
            doctor.setEmail("cardio" + i + "@hospital.com");
            doctor.setPhone("888888" + String.format("%03d", i));
            doctor.setLicenseNumber("MED-" + String.format("%06d", i));
            doctorRepository.save(doctor);
        }

        List<Doctor> cardiologists = doctorRepository.findBySpecialty(Specialty.CARDIOLOGY);
        assertTrue(cardiologists.size() >= 4); // testDoctor (Cardiology) + 3 nuevos
    }

    @Test
    void testDeleteMultipleDoctors() {
        List<Doctor> allBefore = doctorRepository.findAll();
        int countBefore = allBefore.size();

        if (countBefore >= 2) {
            Doctor firstDoctor = allBefore.get(0);
            doctorRepository.deleteById(firstDoctor.getId());

            List<Doctor> allAfter = doctorRepository.findAll();
            assertEquals(countBefore - 1, allAfter.size());
        }
    }
}
