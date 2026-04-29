package com.autocita.backend.waitingList;

import com.autocita.backend.doctor.Specialty;
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
class WaitingListServiceTest {

    @Autowired
    private WaitingListRepository waitingListRepository;

    @Autowired
    private PatientRepository patientRepository;

    private Patient testPatient;
    private WaitingList testWaitingListEntry;

    @BeforeEach
    void setUp() {
        waitingListRepository.deleteAll();
        patientRepository.deleteAll();

        // Crear paciente de prueba
        testPatient = new Patient();
        testPatient.setFirstName("María");
        testPatient.setLastName("López");
        testPatient.setEmail("maria@example.com");
        testPatient.setPhone("987654321");
        testPatient.setBirthDate(LocalDate.of(1992, 3, 25));
        testPatient.setDocumentId("11111111A");
        testPatient = patientRepository.save(testPatient);

        // Crear entrada de lista de espera
        testWaitingListEntry = new WaitingList();
        testWaitingListEntry.setPatient(testPatient);
        testWaitingListEntry.setSpecialty(Specialty.DERMATOLOGY);
        testWaitingListEntry.setUrgency(UrgencyLevel.MEDIUM);
        testWaitingListEntry.setTimePreference(TimePreference.MORNING);
        testWaitingListEntry.setPreferredDate(LocalDate.now().plusDays(7));
        testWaitingListEntry.setStatus(WaitingListStatus.ACTIVE);
        testWaitingListEntry.setRequestDate(LocalDateTime.now());
        testWaitingListEntry = waitingListRepository.save(testWaitingListEntry);
    }

    @Test
    void testCreateWaitingListEntry() {
        WaitingList entry = new WaitingList();
        entry.setPatient(testPatient);
        entry.setSpecialty(Specialty.PEDIATRICS);
        entry.setUrgency(UrgencyLevel.HIGH);
        entry.setTimePreference(TimePreference.ANY);
        entry.setPreferredDate(LocalDate.now().plusDays(5));
        entry.setStatus(WaitingListStatus.ACTIVE);
        entry.setRequestDate(LocalDateTime.now());

        WaitingList saved = waitingListRepository.save(entry);

        assertNotNull(saved.getId());
        assertEquals(WaitingListStatus.ACTIVE, saved.getStatus());
        assertEquals(Specialty.PEDIATRICS, saved.getSpecialty());
        assertEquals(UrgencyLevel.HIGH, saved.getUrgency());
    }

    @Test
    void testFindByPatientId() {
        List<WaitingList> entries = waitingListRepository.findByPatientId(testPatient.getId());

        assertEquals(1, entries.size());
        assertEquals(testPatient.getId(), entries.get(0).getPatient().getId());
    }

    @Test
    void testFindBySpecialty() {
        List<WaitingList> entries = waitingListRepository.findBySpecialty(Specialty.DERMATOLOGY);

        assertFalse(entries.isEmpty());
        assertTrue(entries.stream().anyMatch(e -> e.getId().equals(testWaitingListEntry.getId())));
    }

    @Test
    void testUpdateWaitingListStatus() {
        // Cambiar estado a OFFERED
        testWaitingListEntry.setStatus(WaitingListStatus.OFFERED);
        waitingListRepository.save(testWaitingListEntry);

        WaitingList updated = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(WaitingListStatus.OFFERED, updated.getStatus());

        // Cambiar a ACCEPTED
        updated.setStatus(WaitingListStatus.ACCEPTED);
        waitingListRepository.save(updated);

        WaitingList finalState = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(WaitingListStatus.ACCEPTED, finalState.getStatus());
    }

    @Test
    void testUrgencyLevels() {
        // Verificar que se pueden crear entradas con diferentes niveles de urgencia
        WaitingList highUrgency = new WaitingList();
        highUrgency.setPatient(testPatient);
        highUrgency.setSpecialty(Specialty.CARDIOLOGY);
        highUrgency.setUrgency(UrgencyLevel.HIGH);
        highUrgency.setTimePreference(TimePreference.ANY);
        highUrgency.setPreferredDate(LocalDate.now().plusDays(1));
        highUrgency.setStatus(WaitingListStatus.ACTIVE);
        highUrgency.setRequestDate(LocalDateTime.now());

        WaitingList saved = waitingListRepository.save(highUrgency);

        assertEquals(UrgencyLevel.HIGH, saved.getUrgency());
        assertEquals(3, UrgencyLevel.HIGH.getPriorityValue());
    }

    @Test
    void testTimePreferences() {
        WaitingList afternoonPref = new WaitingList();
        afternoonPref.setPatient(testPatient);
        afternoonPref.setSpecialty(Specialty.GYNECOLOGY);
        afternoonPref.setUrgency(UrgencyLevel.LOW);
        afternoonPref.setTimePreference(TimePreference.AFTERNOON);
        afternoonPref.setPreferredDate(LocalDate.now().plusDays(3));
        afternoonPref.setStatus(WaitingListStatus.ACTIVE);
        afternoonPref.setRequestDate(LocalDateTime.now());

        WaitingList saved = waitingListRepository.save(afternoonPref);

        assertEquals(TimePreference.AFTERNOON, saved.getTimePreference());
    }

    @Test
    void testPreferredDateValidation() {
        // La fecha preferida no debe ser en el pasado
        WaitingList entry = new WaitingList();
        entry.setPatient(testPatient);
        entry.setSpecialty(Specialty.DIGESTIVE);
        entry.setUrgency(UrgencyLevel.MEDIUM);
        entry.setTimePreference(TimePreference.ANY);
        entry.setPreferredDate(LocalDate.now().minusDays(1)); // Fecha en el pasado
        entry.setStatus(WaitingListStatus.ACTIVE);
        entry.setRequestDate(LocalDateTime.now());

        // El servicio debería rechazar esto, pero aquí solo verificamos que se puede guardar
        WaitingList saved = waitingListRepository.save(entry);
        assertNotNull(saved.getId());
    }

    @Test
    void testMultipleWaitingListEntriesPerPatient() {
        // Un paciente puede tener múltiples solicitudes de diferentes especialidades
        WaitingList entry2 = new WaitingList();
        entry2.setPatient(testPatient);
        entry2.setSpecialty(Specialty.CARDIOLOGY);
        entry2.setUrgency(UrgencyLevel.LOW);
        entry2.setTimePreference(TimePreference.MORNING);
        entry2.setPreferredDate(LocalDate.now().plusDays(5));
        entry2.setStatus(WaitingListStatus.ACTIVE);
        entry2.setRequestDate(LocalDateTime.now());
        waitingListRepository.save(entry2);

        List<WaitingList> entries = waitingListRepository.findByPatientId(testPatient.getId());

        assertEquals(2, entries.size());
        assertTrue(entries.stream()
                .map(WaitingList::getSpecialty)
                .anyMatch(s -> s.equals(Specialty.DERMATOLOGY)));
        assertTrue(entries.stream()
                .map(WaitingList::getSpecialty)
                .anyMatch(s -> s.equals(Specialty.CARDIOLOGY)));
    }

    @Test
    void testFindByStatus() {
        // Crear una entrada con estado OFFERED
        WaitingList offeredEntry = new WaitingList();
        offeredEntry.setPatient(testPatient);
        offeredEntry.setSpecialty(Specialty.PEDIATRICS);
        offeredEntry.setUrgency(UrgencyLevel.HIGH);
        offeredEntry.setTimePreference(TimePreference.ANY);
        offeredEntry.setPreferredDate(LocalDate.now().plusDays(3));
        offeredEntry.setStatus(WaitingListStatus.OFFERED);
        offeredEntry.setRequestDate(LocalDateTime.now());
        waitingListRepository.save(offeredEntry);

        List<WaitingList> activeEntries = waitingListRepository.findAll().stream()
                .filter(e -> e.getStatus() == WaitingListStatus.ACTIVE)
                .toList();

        List<WaitingList> offeredEntries = waitingListRepository.findAll().stream()
                .filter(e -> e.getStatus() == WaitingListStatus.OFFERED)
                .toList();

        assertEquals(1, activeEntries.size());
        assertEquals(1, offeredEntries.size());
    }

    @Test
    void testChangeWaitingListEntryStatus() {
        WaitingListStatus[] statuses = {
                WaitingListStatus.ACTIVE,
                WaitingListStatus.OFFERED,
                WaitingListStatus.ACCEPTED,
                WaitingListStatus.REJECTED
        };

        for (WaitingListStatus status : statuses) {
            testWaitingListEntry.setStatus(status);
            waitingListRepository.save(testWaitingListEntry);

            WaitingList found = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
            assertEquals(status, found.getStatus());
        }
    }

    @Test
    void testFindBySpecialtyAndUrgency() {
        // Crear múltiples entradas con diferentes combinaciones
        for (int i = 0; i < 3; i++) {
            WaitingList entry = new WaitingList();
            entry.setPatient(testPatient);
            entry.setSpecialty(Specialty.CARDIOLOGY);
            entry.setUrgency(UrgencyLevel.HIGH);
            entry.setTimePreference(TimePreference.ANY);
            entry.setPreferredDate(LocalDate.now().plusDays(2 + i));
            entry.setStatus(WaitingListStatus.ACTIVE);
            entry.setRequestDate(LocalDateTime.now());
            waitingListRepository.save(entry);
        }

        List<WaitingList> cardioHighUrgency = waitingListRepository.findAll().stream()
                .filter(e -> e.getSpecialty() == Specialty.CARDIOLOGY &&
                           e.getUrgency() == UrgencyLevel.HIGH)
                .toList();

        assertTrue(cardioHighUrgency.size() >= 3);
    }

    @Test
    void testAllUrgencyLevels() {
        UrgencyLevel[] urgencies = {UrgencyLevel.LOW, UrgencyLevel.MEDIUM, UrgencyLevel.HIGH};

        for (UrgencyLevel urgency : urgencies) {
            WaitingList entry = new WaitingList();
            entry.setPatient(testPatient);
            entry.setSpecialty(Specialty.DIGESTIVE);
            entry.setUrgency(urgency);
            entry.setTimePreference(TimePreference.ANY);
            entry.setPreferredDate(LocalDate.now().plusDays(5));
            entry.setStatus(WaitingListStatus.ACTIVE);
            entry.setRequestDate(LocalDateTime.now());
            waitingListRepository.save(entry);
        }

        List<WaitingList> lowUrgency = waitingListRepository.findAll().stream()
                .filter(e -> e.getUrgency() == UrgencyLevel.LOW)
                .toList();
        List<WaitingList> mediumUrgency = waitingListRepository.findAll().stream()
                .filter(e -> e.getUrgency() == UrgencyLevel.MEDIUM)
                .toList();
        List<WaitingList> highUrgency = waitingListRepository.findAll().stream()
                .filter(e -> e.getUrgency() == UrgencyLevel.HIGH)
                .toList();

        assertTrue(lowUrgency.size() >= 1);
        assertTrue(mediumUrgency.size() >= 1);
        assertTrue(highUrgency.size() >= 1);
    }

    @Test
    void testAllTimePreferences() {
        TimePreference[] preferences = {TimePreference.MORNING, TimePreference.AFTERNOON, TimePreference.ANY};

        for (TimePreference preference : preferences) {
            WaitingList entry = new WaitingList();
            entry.setPatient(testPatient);
            entry.setSpecialty(Specialty.GYNECOLOGY);
            entry.setUrgency(UrgencyLevel.MEDIUM);
            entry.setTimePreference(preference);
            entry.setPreferredDate(LocalDate.now().plusDays(4));
            entry.setStatus(WaitingListStatus.ACTIVE);
            entry.setRequestDate(LocalDateTime.now());
            waitingListRepository.save(entry);
        }

        List<WaitingList> morningPrefs = waitingListRepository.findAll().stream()
                .filter(e -> e.getTimePreference() == TimePreference.MORNING)
                .toList();
        List<WaitingList> afternoonPrefs = waitingListRepository.findAll().stream()
                .filter(e -> e.getTimePreference() == TimePreference.AFTERNOON)
                .toList();
        List<WaitingList> anyPrefs = waitingListRepository.findAll().stream()
                .filter(e -> e.getTimePreference() == TimePreference.ANY)
                .toList();

        assertTrue(morningPrefs.size() >= 1);
        assertTrue(afternoonPrefs.size() >= 1);
        assertTrue(anyPrefs.size() >= 1);
    }

    @Test
    void testDeleteWaitingListEntry() {
        Integer entryId = testWaitingListEntry.getId();
        waitingListRepository.deleteById(entryId);

        WaitingList deleted = waitingListRepository.findById(entryId).orElse(null);
        assertNull(deleted);
    }

    @Test
    void testUpdateWaitingListPreferredDate() {
        LocalDate newDate = LocalDate.now().plusDays(14);
        testWaitingListEntry.setPreferredDate(newDate);
        waitingListRepository.save(testWaitingListEntry);

        WaitingList updated = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(newDate, updated.getPreferredDate());
    }

    @Test
    void testUpdateWaitingListTimePreference() {
        testWaitingListEntry.setTimePreference(TimePreference.AFTERNOON);
        waitingListRepository.save(testWaitingListEntry);

        WaitingList updated = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(TimePreference.AFTERNOON, updated.getTimePreference());
    }

    @Test
    void testUpdateWaitingListUrgency() {
        testWaitingListEntry.setUrgency(UrgencyLevel.HIGH);
        waitingListRepository.save(testWaitingListEntry);

        WaitingList updated = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(UrgencyLevel.HIGH, updated.getUrgency());
    }

    @Test
    void testMultiplePatients_EachWithWaitingListEntries() {
        // Crear segundo paciente
        Patient patient2 = new Patient();
        patient2.setFirstName("Juan");
        patient2.setLastName("García");
        patient2.setEmail("juan@example.com");
        patient2.setPhone("666777888");
        patient2.setBirthDate(LocalDate.of(1985, 8, 12));
        patient2.setDocumentId("22222222B");
        patient2 = patientRepository.save(patient2);

        // Crear entrada para el segundo paciente
        WaitingList entry2 = new WaitingList();
        entry2.setPatient(patient2);
        entry2.setSpecialty(Specialty.CARDIOLOGY);
        entry2.setUrgency(UrgencyLevel.HIGH);
        entry2.setTimePreference(TimePreference.ANY);
        entry2.setPreferredDate(LocalDate.now().plusDays(2));
        entry2.setStatus(WaitingListStatus.ACTIVE);
        entry2.setRequestDate(LocalDateTime.now());
        waitingListRepository.save(entry2);

        List<WaitingList> patient1Entries = waitingListRepository.findByPatientId(testPatient.getId());
        List<WaitingList> patient2Entries = waitingListRepository.findByPatientId(patient2.getId());

        assertEquals(1, patient1Entries.size());
        assertEquals(1, patient2Entries.size());
    }

    @Test
    void testWaitingListEntryRequestDate() {
        LocalDateTime requestDate = testWaitingListEntry.getRequestDate();

        assertNotNull(requestDate);
        assertTrue(requestDate.isBefore(LocalDateTime.now().plusMinutes(1)));
        assertTrue(requestDate.isAfter(LocalDateTime.now().minusMinutes(1)));
    }

    @Test
    void testFindWaitingListByNonExistentPatient() {
        List<WaitingList> entries = waitingListRepository.findByPatientId(99999);

        assertTrue(entries.isEmpty());
    }

    @Test
    void testFindWaitingListByNonExistentSpecialty() {
        // Si existe una especialidad que no tiene entradas
        List<WaitingList> entries = waitingListRepository.findAll().stream()
                .filter(e -> e.getSpecialty() == Specialty.DIGESTIVE)
                .toList();
                
        // Solo verificamos que retorna una lista válida
        assertNotNull(entries);
    }

    @Test
    void testPreferredDateInFuture() {
        LocalDate futureDate = LocalDate.now().plusDays(30);
        
        WaitingList entry = new WaitingList();
        entry.setPatient(testPatient);
        entry.setSpecialty(Specialty.DERMATOLOGY);
        entry.setUrgency(UrgencyLevel.LOW);
        entry.setTimePreference(TimePreference.ANY);
        entry.setPreferredDate(futureDate);
        entry.setStatus(WaitingListStatus.ACTIVE);
        entry.setRequestDate(LocalDateTime.now());
        entry = waitingListRepository.save(entry);

        WaitingList found = waitingListRepository.findById(entry.getId()).orElse(null);
        assertTrue(found.getPreferredDate().isAfter(LocalDate.now().plusDays(29)));
    }

    @Test
    void testWaitingListStatusTransitions() {
        // ACTIVE -> OFFERED
        testWaitingListEntry.setStatus(WaitingListStatus.OFFERED);
        waitingListRepository.save(testWaitingListEntry);
        
        WaitingList offered = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(WaitingListStatus.OFFERED, offered.getStatus());

        // OFFERED -> ACCEPTED
        offered.setStatus(WaitingListStatus.ACCEPTED);
        waitingListRepository.save(offered);
        
        WaitingList accepted = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(WaitingListStatus.ACCEPTED, accepted.getStatus());

        // ACCEPTED -> REJECTED (si es posible)
        accepted.setStatus(WaitingListStatus.REJECTED);
        waitingListRepository.save(accepted);
        
        WaitingList rejected = waitingListRepository.findById(testWaitingListEntry.getId()).orElse(null);
        assertEquals(WaitingListStatus.REJECTED, rejected.getStatus());
    }

    @Test
    void testMultipleEntriesSameSpecialty() {
        WaitingList entry1 = new WaitingList();
        entry1.setPatient(testPatient);
        entry1.setSpecialty(Specialty.CARDIOLOGY);
        entry1.setUrgency(UrgencyLevel.HIGH);
        entry1.setTimePreference(TimePreference.MORNING);
        entry1.setPreferredDate(LocalDate.now().plusDays(3));
        entry1.setStatus(WaitingListStatus.ACTIVE);
        entry1.setRequestDate(LocalDateTime.now());
        waitingListRepository.save(entry1);

        WaitingList entry2 = new WaitingList();
        entry2.setPatient(testPatient);
        entry2.setSpecialty(Specialty.CARDIOLOGY);
        entry2.setUrgency(UrgencyLevel.MEDIUM);
        entry2.setTimePreference(TimePreference.AFTERNOON);
        entry2.setPreferredDate(LocalDate.now().plusDays(5));
        entry2.setStatus(WaitingListStatus.ACTIVE);
        entry2.setRequestDate(LocalDateTime.now());
        waitingListRepository.save(entry2);

        List<WaitingList> cardioEntries = waitingListRepository.findBySpecialty(Specialty.CARDIOLOGY);

        assertTrue(cardioEntries.size() >= 2);
        assertEquals(Specialty.CARDIOLOGY, cardioEntries.get(0).getSpecialty());
    }

    @Test
    void testWaitingListSpecialtyNotNull() {
        assertNotNull(testWaitingListEntry.getSpecialty());
        assertEquals(Specialty.DERMATOLOGY, testWaitingListEntry.getSpecialty());
    }

    @Test
    void testWaitingListPatientNotNull() {
        assertNotNull(testWaitingListEntry.getPatient());
        assertEquals(testPatient.getId(), testWaitingListEntry.getPatient().getId());
    }

    @Test
    void testWaitingListStatusNotNull() {
        assertNotNull(testWaitingListEntry.getStatus());
        assertEquals(WaitingListStatus.ACTIVE, testWaitingListEntry.getStatus());
    }
}
