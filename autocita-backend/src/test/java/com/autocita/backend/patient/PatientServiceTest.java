package com.autocita.backend.patient;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class PatientServiceTest {

    @Autowired
    private PatientRepository patientRepository;

    private Patient testPatient;

    @BeforeEach
    void setUp() {
        // Limpiar datos previos respetando constraints
        patientRepository.deleteAll();

        testPatient = new Patient();
        testPatient.setFirstName("Carlos");
        testPatient.setLastName("Martínez");
        testPatient.setEmail("carlos@example.com");
        testPatient.setPhone("555123456");
        testPatient.setBirthDate(LocalDate.of(1990, 1, 15));
        testPatient.setDocumentId("12345678Z");
        testPatient = patientRepository.save(testPatient);
    }

    @Test
    void testCreatePatient() {
        Patient patient = new Patient();
        patient.setFirstName("Ana");
        patient.setLastName("Rodríguez");
        patient.setEmail("ana@example.com");
        patient.setPhone("555789012");
        patient.setBirthDate(LocalDate.of(1985, 5, 20));
        patient.setDocumentId("87654321X");

        Patient saved = patientRepository.save(patient);

        assertNotNull(saved.getId());
        assertEquals("Ana", saved.getFirstName());
        assertEquals("ana@example.com", saved.getEmail());
    }

    @Test
    void testFindPatientById() {
        Patient found = patientRepository.findById(testPatient.getId()).orElse(null);

        assertNotNull(found);
        assertEquals("Carlos", found.getFirstName());
        assertEquals("carlos@example.com", found.getEmail());
    }

    @Test
    void testUpdatePatient() {
        testPatient.setPhone("555999888");
        patientRepository.save(testPatient);

        Patient updated = patientRepository.findById(testPatient.getId()).orElse(null);
        assertEquals("555999888", updated.getPhone());
    }

    @Test
    void testPatientEmailValidation() {
        // Verificar que el email se guardó correctamente
        assertEquals("carlos@example.com", testPatient.getEmail());
        assertTrue(testPatient.getEmail().contains("@"));
    }

    @Test
    void testFindPatientByEmail() {
        Patient found = patientRepository.findByEmail("carlos@example.com").orElse(null);

        assertNotNull(found);
        assertEquals(testPatient.getId(), found.getId());
    }

    @Test
    void testPatientPhoneFormat() {
        assertTrue(testPatient.getPhone().matches("\\d{9,15}"));
    }

    @Test
    void testDeletePatient() {
        Integer patientId = testPatient.getId();
        patientRepository.deleteById(patientId);

        Patient deleted = patientRepository.findById(patientId).orElse(null);
        assertNull(deleted);
    }

    @Test
    void testFindPatientByDocumentId() {
        Patient found = patientRepository.findByDocumentId("12345678Z").orElse(null);

        assertNotNull(found);
        assertEquals("Carlos", found.getFirstName());
        assertEquals(testPatient.getId(), found.getId());
    }

    @Test
    void testFindPatientByNonExistentDocumentId() {
        Patient found = patientRepository.findByDocumentId("99999999Z").orElse(null);

        assertNull(found);
    }

    @Test
    void testPatientBirthDate() {
        LocalDate birthDate = testPatient.getBirthDate();

        assertNotNull(birthDate);
        assertEquals(1990, birthDate.getYear());
        assertEquals(1, birthDate.getMonthValue());
        assertEquals(15, birthDate.getDayOfMonth());
    }

    @Test
    void testUpdatePatientFullName() {
        testPatient.setFirstName("Carlos Manuel");
        testPatient.setLastName("Martínez García");
        patientRepository.save(testPatient);

        Patient updated = patientRepository.findById(testPatient.getId()).orElse(null);
        assertEquals("Carlos Manuel", updated.getFirstName());
        assertEquals("Martínez García", updated.getLastName());
    }

    @Test
    void testUpdatePatientEmail() {
        testPatient.setEmail("carlosexample@newemail.com");
        patientRepository.save(testPatient);

        Patient updated = patientRepository.findById(testPatient.getId()).orElse(null);
        assertEquals("carlosexample@newemail.com", updated.getEmail());
    }

    @Test
    void testUpdatePatientAllContactInfo() {
        testPatient.setEmail("newcarlos@example.com");
        testPatient.setPhone("666777888");
        patientRepository.save(testPatient);

        Patient updated = patientRepository.findById(testPatient.getId()).orElse(null);
        assertEquals("newcarlos@example.com", updated.getEmail());
        assertEquals("666777888", updated.getPhone());
    }

    @Test
    void testPatientDocumentIdFormat() {
        assertTrue(testPatient.getDocumentId().matches("[0-9]{8}[A-Z]"));
    }

    @Test
    void testMultiplePatientsWithDifferentDocuments() {
        Patient patient2 = new Patient();
        patient2.setFirstName("Juan");
        patient2.setLastName("García");
        patient2.setEmail("juan@example.com");
        patient2.setPhone("555888999");
        patient2.setBirthDate(LocalDate.of(1988, 6, 20));
        patient2.setDocumentId("99999999X");
        patient2 = patientRepository.save(patient2);

        Patient patient3 = new Patient();
        patient3.setFirstName("María");
        patient3.setLastName("López");
        patient3.setEmail("maria@example.com");
        patient3.setPhone("555111222");
        patient3.setBirthDate(LocalDate.of(1995, 3, 10));
        patient3.setDocumentId("88888888A");
        patient3 = patientRepository.save(patient3);

        List<Patient> allPatients = patientRepository.findAll();
        assertEquals(3, allPatients.size());

        Patient foundByDoc2 = patientRepository.findByDocumentId("99999999X").orElse(null);
        assertNotNull(foundByDoc2);
        assertEquals("Juan", foundByDoc2.getFirstName());

        Patient foundByDoc3 = patientRepository.findByDocumentId("88888888A").orElse(null);
        assertNotNull(foundByDoc3);
        assertEquals("María", foundByDoc3.getFirstName());
    }

    @Test
    void testPatientNameNotEmpty() {
        assertNotNull(testPatient.getFirstName());
        assertNotNull(testPatient.getLastName());
        assertTrue(testPatient.getFirstName().length() > 0);
        assertTrue(testPatient.getLastName().length() > 0);
    }

    @Test
    void testPatientContactInfoNotEmpty() {
        assertNotNull(testPatient.getEmail());
        assertNotNull(testPatient.getPhone());
        assertTrue(testPatient.getEmail().length() > 0);
        assertTrue(testPatient.getPhone().length() > 0);
    }

    @Test
    void testFindNonExistentPatient() {
        Patient found = patientRepository.findById(99999).orElse(null);
        assertNull(found);
    }

    @Test
    void testUpdatePatientBirthDate() {
        LocalDate newBirthDate = LocalDate.of(1992, 12, 25);
        testPatient.setBirthDate(newBirthDate);
        patientRepository.save(testPatient);

        Patient updated = patientRepository.findById(testPatient.getId()).orElse(null);
        assertEquals(newBirthDate, updated.getBirthDate());
    }

    @Test
    void testPatientWithDifferentDocumentTypes() {
        // Pacientes con diferentes tipos de documento
        Patient patientWithZ = new Patient();
        patientWithZ.setFirstName("Pedro");
        patientWithZ.setLastName("Fernández");
        patientWithZ.setEmail("pedro@example.com");
        patientWithZ.setPhone("555333444");
        patientWithZ.setBirthDate(LocalDate.of(1980, 7, 5));
        patientWithZ.setDocumentId("77777777Z");
        patientWithZ = patientRepository.save(patientWithZ);

        Patient patientWithX = new Patient();
        patientWithX.setFirstName("Sofía");
        patientWithX.setLastName("Sánchez");
        patientWithX.setEmail("sofia@example.com");
        patientWithX.setPhone("555555666");
        patientWithX.setBirthDate(LocalDate.of(1998, 11, 14));
        patientWithX.setDocumentId("66666666X");
        patientWithX = patientRepository.save(patientWithX);

        Patient foundZ = patientRepository.findByDocumentId("77777777Z").orElse(null);
        Patient foundX = patientRepository.findByDocumentId("66666666X").orElse(null);

        assertNotNull(foundZ);
        assertNotNull(foundX);
        assertEquals("Pedro", foundZ.getFirstName());
        assertEquals("Sofía", foundX.getFirstName());
    }

    @Test
    void testPatientByEmailReturnsMissingWhenNotFound() {
        Patient found = patientRepository.findByEmail("nonexistent@example.com").orElse(null);
        assertNull(found);
    }

    @Test
    void testMultiplePatientsWithSameEmail() {
        // Aunque idealmente el email sería único, testeamos el comportamiento
        Patient patient2 = new Patient();
        patient2.setFirstName("José");
        patient2.setLastName("Martínez");
        patient2.setEmail("carlos@example.com"); // Mismo email (si se permite)
        patient2.setPhone("555666777");
        patient2.setBirthDate(LocalDate.of(1991, 8, 20));
        patient2.setDocumentId("55555555B");

        // Intentar guardar 
        try {
            patientRepository.save(patient2);
        } catch (Exception e) {
            // Se espera excepción si el email debe ser único
        }
    }

    @Test
    void testPatientPhoneCanBeUpdatedMultipleTimes() {
        testPatient.setPhone("111111111");
        patientRepository.save(testPatient);
        assertEquals("111111111", patientRepository.findById(testPatient.getId()).orElse(null).getPhone());

        testPatient.setPhone("222222222");
        patientRepository.save(testPatient);
        assertEquals("222222222", patientRepository.findById(testPatient.getId()).orElse(null).getPhone());

        testPatient.setPhone("333333333");
        patientRepository.save(testPatient);
        assertEquals("333333333", patientRepository.findById(testPatient.getId()).orElse(null).getPhone());
    }

    @Test
    void testDeleteMultiplePatients() {
        Patient patient2 = new Patient();
        patient2.setFirstName("Elena");
        patient2.setLastName("Ruiz");
        patient2.setEmail("elena@example.com");
        patient2.setPhone("555444555");
        patient2.setBirthDate(LocalDate.of(1987, 2, 14));
        patient2.setDocumentId("44444444C");
        patient2 = patientRepository.save(patient2);

        int countBefore = patientRepository.findAll().size();

        patientRepository.deleteById(testPatient.getId());
        patientRepository.deleteById(patient2.getId());

        int countAfter = patientRepository.findAll().size();
        assertEquals(countBefore - 2, countAfter);
    }

    @Test
    void testPatientBirthdateAgeCalculation() {
        LocalDate birthDate = testPatient.getBirthDate();
        int year = LocalDate.now().getYear();
        int age = year - birthDate.getYear();

        assertTrue(age > 0);
        assertTrue(age < 150); // Validación de cordura
    }

    @Test
    void testFindAllPatients() {
        Patient patient2 = new Patient();
        patient2.setFirstName("Lucia");
        patient2.setLastName("Díaz");
        patient2.setEmail("lucia@example.com");
        patient2.setPhone("555999111");
        patient2.setBirthDate(LocalDate.of(1993, 4, 22));
        patient2.setDocumentId("33333333D");
        patientRepository.save(patient2);

        Patient patient3 = new Patient();
        patient3.setFirstName("Miguel");
        patient3.setLastName("Cortés");
        patient3.setEmail("miguel@example.com");
        patient3.setPhone("555222333");
        patient3.setBirthDate(LocalDate.of(1986, 9, 30));
        patient3.setDocumentId("22222222E");
        patientRepository.save(patient3);

        List<Patient> allPatients = patientRepository.findAll();
        assertEquals(3, allPatients.size());

        assertTrue(allPatients.stream().anyMatch(p -> "Carlos".equals(p.getFirstName())));
        assertTrue(allPatients.stream().anyMatch(p -> "Lucia".equals(p.getFirstName())));
        assertTrue(allPatients.stream().anyMatch(p -> "Miguel".equals(p.getFirstName())));
    }
}
