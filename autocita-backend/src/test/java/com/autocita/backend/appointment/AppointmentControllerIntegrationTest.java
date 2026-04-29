package com.autocita.backend.appointment;

import com.autocita.backend.doctor.Doctor;
import com.autocita.backend.doctor.DoctorRepository;
import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.doctor.WorkShift;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.patient.PatientRepository;
import com.autocita.backend.security.Role;
import com.autocita.backend.security.User;
import com.autocita.backend.security.UserRepository;
import com.autocita.backend.waitingList.WaitingListRepository;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase
@ActiveProfiles("test")
class AppointmentControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private WaitingListRepository waitingListRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @MockBean  private JavaMailSender mailSender;

    private Doctor savedDoctor;
    private Patient savedPatient;
    private Appointment savedAppointment;

    @BeforeEach
    void setUp() {
        waitingListRepository.deleteAll();
        appointmentRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        userRepository.deleteAll();

        User doctorUser = new User();
        doctorUser.setUsername("doctor");
        doctorUser.setPassword(passwordEncoder.encode("password"));
        doctorUser.setRole(Role.DOCTOR);
        doctorUser = userRepository.save(doctorUser);

        savedDoctor = new Doctor();
        savedDoctor.setFirstName("García");
        savedDoctor.setLastName("García");
        savedDoctor.setSpecialty(Specialty.CARDIOLOGY);
        savedDoctor.setWorkShift(WorkShift.ANY);
        savedDoctor.setEmail("garcia@hospital.com");
        savedDoctor.setPhone("600222222");
        savedDoctor.setLicenseNumber("MED-CAR001");
        savedDoctor.setUser(doctorUser);
        savedDoctor = doctorRepository.save(savedDoctor);

        User patientUser = new User();
        patientUser.setUsername("patient");
        patientUser.setPassword(passwordEncoder.encode("password"));
        patientUser.setRole(Role.PATIENT);
        patientUser = userRepository.save(patientUser);

        savedPatient = new Patient();
        savedPatient.setFirstName("María");
        savedPatient.setLastName("López");
        savedPatient.setEmail("maria@test.com");
        savedPatient.setPhone("600333333");
        savedPatient.setBirthDate(LocalDate.of(1990, 5, 15));
        savedPatient.setDocumentId("12345678A");
        savedPatient.setUser(patientUser);
        savedPatient = patientRepository.save(savedPatient);

        savedAppointment = new Appointment();
        savedAppointment.setDoctor(savedDoctor);
        savedAppointment.setPatient(savedPatient);
        savedAppointment.setStartTime(
                LocalDateTime.now().plusDays(5).withHour(10).withMinute(0).withSecond(0).withNano(0));
        savedAppointment.setStatus(AppointmentStatus.ASSIGNED);
        savedAppointment.setDurationMinutes(60);
        savedAppointment = appointmentRepository.save(savedAppointment);
    }

    @Test
    @WithMockUser
    void getAllAppointments_returnsOk() throws Exception {
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser
    void getAppointmentsByPatient_returnsPatientAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments/patient/{patientId}", savedPatient.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].status").value("ASSIGNED"));
    }

    @Test
    @WithMockUser
    void getAppointmentsByDoctor_returnsDoctorAppointments() throws Exception {
        mockMvc.perform(get("/api/appointments/doctor/{doctorId}", savedDoctor.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser
    void createAppointment_validRequest_returnsAssignedAppointment() throws Exception {
        LocalDateTime futureTime = LocalDateTime.now().plusDays(10)
                .withHour(11).withMinute(0).withSecond(0).withNano(0);
        String body = "{\"doctorId\":" + savedDoctor.getId() +
                      ",\"patientId\":" + savedPatient.getId() +
                      ",\"startTime\":\"" + futureTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "\"}";

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"));
    }

    @Test
    @WithMockUser
    void deleteAppointment_existingId_returns204() throws Exception {
        mockMvc.perform(delete("/api/appointments/{id}", savedAppointment.getId()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void confirmAppointment_doctorRole_returnsOk() throws Exception {
        mockMvc.perform(put("/api/appointments/{id}/confirm", savedAppointment.getId()))
                .andExpect(status().isOk());
    }
}
