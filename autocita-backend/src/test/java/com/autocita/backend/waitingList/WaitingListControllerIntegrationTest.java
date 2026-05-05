package com.autocita.backend.waitingList;

import com.autocita.backend.appointment.AppointmentRepository;
import com.autocita.backend.doctor.DoctorRepository;
import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.reassignmentLog.ReassignmentLogRepository;
import com.autocita.backend.prescription.PrescriptionRepository;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.patient.PatientRepository;
import com.autocita.backend.security.Role;
import com.autocita.backend.security.User;
import com.autocita.backend.security.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase
@ActiveProfiles("test")
class WaitingListControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private WaitingListRepository waitingListRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private ReassignmentLogRepository reassignmentLogRepository;
    @Autowired
    private PrescriptionRepository prescriptionRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @MockBean
    private JavaMailSender mailSender;

    private Patient savedPatient;

    @BeforeEach
    void setUp() {
        prescriptionRepository.deleteAll();
        reassignmentLogRepository.deleteAll();
        waitingListRepository.deleteAll();
        appointmentRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User();
        user.setUsername("user");
        user.setPassword(passwordEncoder.encode("password"));
        user.setRole(Role.PATIENT);

        savedPatient = new Patient();
        savedPatient.setFirstName("Francesca");
        savedPatient.setLastName("Romano");
        savedPatient.setEmail("francesca@test.com");
        savedPatient.setPhone("600777777");
        savedPatient.setBirthDate(LocalDate.of(1992, 6, 20));
        savedPatient.setDocumentId("56789012D");
        savedPatient.setUser(user);
        savedPatient = patientRepository.save(savedPatient);
    }

    @Test
    @WithMockUser
    void getWaitingListByPatient_returnsGroupedResponse() throws Exception {
        mockMvc.perform(get("/api/waiting-list/patient/{patientId}", savedPatient.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").isArray())
                .andExpect(jsonPath("$.offered").isArray())
                .andExpect(jsonPath("$.accepted").isArray());
    }

    @Test
    @WithMockUser
    void addToWaitingList_validRequest_returnsOk() throws Exception {
        String futureDate = LocalDate.now().plusDays(5).toString();

        mockMvc.perform(post("/api/waiting-list")
                .param("patientId", savedPatient.getId().toString())
                .param("specialty", "CARDIOLOGY")
                .param("urgency", "HIGH")
                .param("timePref", "MORNING")
                .param("preferredDate", futureDate))
                .andExpect(status().isOk())
                .andExpect(content().string("Añadido a lista de espera"));
    }

    @Test
    @WithMockUser
    void addToWaitingList_duplicateSameDay_returnsBadRequest() throws Exception {
        WaitingList existing = new WaitingList();
        existing.setPatient(savedPatient);
        existing.setSpecialty(Specialty.CARDIOLOGY);
        existing.setUrgency(UrgencyLevel.HIGH);
        existing.setTimePreference(TimePreference.ANY);
        existing.setPreferredDate(LocalDate.now().plusDays(1));
        existing.setStatus(WaitingListStatus.ACTIVE);
        existing.setRequestDate(LocalDateTime.now());
        existing.setExpectedDurationMinutes(60);
        waitingListRepository.save(existing);

        mockMvc.perform(post("/api/waiting-list")
                .param("patientId", savedPatient.getId().toString())
                .param("specialty", "DERMATOLOGY")
                .param("urgency", "LOW")
                .param("timePref", "ANY")
                .param("preferredDate", LocalDate.now().plusDays(2).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void removeFromWaitingList_existingEntry_returnsOk() throws Exception {
        WaitingList entry = new WaitingList();
        entry.setPatient(savedPatient);
        entry.setSpecialty(Specialty.CARDIOLOGY);
        entry.setUrgency(UrgencyLevel.MEDIUM);
        entry.setTimePreference(TimePreference.MORNING);
        entry.setPreferredDate(LocalDate.now().plusDays(3));
        entry.setStatus(WaitingListStatus.ACTIVE);
        entry.setRequestDate(LocalDateTime.now());
        entry.setExpectedDurationMinutes(60);
        entry = waitingListRepository.save(entry);

        mockMvc.perform(delete("/api/waiting-list/{waitingListId}", entry.getId())
                .param("patientId", savedPatient.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(content().string("Solicitud eliminada de la lista de espera"));
    }
}
