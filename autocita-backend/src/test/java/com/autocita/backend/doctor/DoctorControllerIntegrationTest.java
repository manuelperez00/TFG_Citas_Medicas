package com.autocita.backend.doctor;

import com.autocita.backend.appointment.AppointmentRepository;
import com.autocita.backend.patient.PatientRepository;
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
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase
@ActiveProfiles("test")
class DoctorControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private WaitingListRepository waitingListRepository;
    @Autowired private ReassignmentLogRepository reassignmentLogRepository;
    @Autowired private PrescriptionRepository prescriptionRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @MockBean  private JavaMailSender mailSender;

    private Doctor savedDoctor;

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
        user.setRole(Role.DOCTOR);
        user = userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setFirstName("Elena");
        doctor.setLastName("Fuentes");
        doctor.setSpecialty(Specialty.CARDIOLOGY);
        doctor.setWorkShift(WorkShift.MORNING);
        doctor.setEmail("elena@hospital.com");
        doctor.setPhone("600111111");
        doctor.setLicenseNumber("MED-CAR001");
        doctor.setUser(user);
        savedDoctor = doctorRepository.save(doctor);
    }

    @Test
    @WithMockUser
    void getAllDoctors_returnsListWithSavedDoctor() throws Exception {
        mockMvc.perform(get("/api/doctors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].firstName").value("Elena"));
    }

    @Test
    @WithMockUser
    void getDoctorById_existingId_returnsDoctor() throws Exception {
        mockMvc.perform(get("/api/doctors/{id}", savedDoctor.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Elena"))
                .andExpect(jsonPath("$.specialty").value("CARDIOLOGY"));
    }

    @Test
    @WithMockUser
    void getDoctorById_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/doctors/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "user", roles = "DOCTOR")
    void getMyDoctor_returnsOwnProfile() throws Exception {
        mockMvc.perform(get("/api/doctors/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Elena"));
    }
}
