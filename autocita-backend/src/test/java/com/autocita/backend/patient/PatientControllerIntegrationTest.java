package com.autocita.backend.patient;

import com.autocita.backend.appointment.AppointmentRepository;
import com.autocita.backend.doctor.DoctorRepository;
import com.autocita.backend.security.Role;
import com.autocita.backend.security.User;
import com.autocita.backend.security.UserRepository;
import com.autocita.backend.waitingList.WaitingListRepository;
import com.autocita.backend.reassignmentLog.ReassignmentLogRepository;
import com.autocita.backend.prescription.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase
@ActiveProfiles("test")
class PatientControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WaitingListRepository waitingListRepository;
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

        Patient patient = new Patient();
        patient.setFirstName("María");
        patient.setLastName("González");
        patient.setEmail("maria@test.com");
        patient.setPhone("600111111");
        patient.setBirthDate(LocalDate.of(1990, 5, 15));
        patient.setDocumentId("12345678A");
        patient.setUser(user);
        savedPatient = patientRepository.save(patient);
    }

    @Test
    @WithMockUser
    void getAllPatients_returnsListWithSavedPatient() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].firstName").value("María"));
    }

    @Test
    @WithMockUser
    void getPatientById_existingId_returnsPatient() throws Exception {
        mockMvc.perform(get("/api/patients/{id}", savedPatient.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("María"))
                .andExpect(jsonPath("$.documentId").value("12345678A"));
    }

    @Test
    @WithMockUser
    void getPatientById_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/patients/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "user", roles = "PATIENT")
    void getMyPatient_returnsOwnProfile() throws Exception {
        mockMvc.perform(get("/api/patients/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("María"));
    }

    @Test
    @WithMockUser(username = "user", roles = "PATIENT")
    void updateMyPatient_updatesPhone() throws Exception {
        mockMvc.perform(put("/api/patients/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"phone\":\"699888777\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("699888777"));
    }
}
