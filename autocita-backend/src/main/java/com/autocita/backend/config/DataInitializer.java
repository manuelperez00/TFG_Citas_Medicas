package com.autocita.backend.config;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.appointment.AppointmentRepository;
import com.autocita.backend.appointment.AppointmentStatus;
import com.autocita.backend.doctor.Doctor;
import com.autocita.backend.doctor.DoctorRepository;
import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.doctor.WorkShift;
import com.autocita.backend.patient.Gender;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.patient.PatientRepository;
import com.autocita.backend.security.Role;
import com.autocita.backend.security.User;
import com.autocita.backend.security.UserRepository;
import com.autocita.backend.waitingList.TimePreference;
import com.autocita.backend.waitingList.UrgencyLevel;
import com.autocita.backend.waitingList.WaitingList;
import com.autocita.backend.waitingList.WaitingListRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private WaitingListRepository waitingListRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0)
            return;

        System.out.println("--- INICIANDO CARGA MASIVA DE DATOS DE PRUEBA ---");

        // ADMIN
        crearUsuario("admin", "admin123", Role.ADMIN);

        // MÉDICOS
        Doctor house = crearDoctor("doctor1", "Gregory", "House", Specialty.CARDIOLOGY, WorkShift.MORNING);
        System.out.println("Created doctor house with id=" + house.getId() + " userId=" + house.getUser().getId());
        Doctor grey = crearDoctor("doctor2", "Meredith", "Grey", Specialty.DIGESTIVE, WorkShift.MORNING);
        System.out.println("Created doctor grey with id=" + grey.getId() + " userId=" + grey.getUser().getId());
        Doctor shepherd = crearDoctor("doctor3", "Derek", "Shepherd", Specialty.DERMATOLOGY, WorkShift.AFTERNOON);
        System.out.println(
                "Created doctor shepherd with id=" + shepherd.getId() + " userId=" + shepherd.getUser().getId());
        Doctor wilson = crearDoctor("doctor4", "James", "Wilson", Specialty.GYNECOLOGY, WorkShift.AFTERNOON);
        System.out.println("Created doctor wilson with id=" + wilson.getId() + " userId=" + wilson.getUser().getId());
        Doctor melendez = crearDoctor("doctor5", "Neil", "Melendez", Specialty.PEDIATRICS, WorkShift.ANY);
        System.out.println(
                "Created doctor melendez with id=" + melendez.getId() + " userId=" + melendez.getUser().getId());

        // PACIENTES
        Patient p1 = crearPaciente("paciente1", "Juan", "Perez", "11111111A");
        Patient p2 = crearPaciente("paciente2", "Ana", "García", "22222222B");
        Patient p3 = crearPaciente("paciente3", "Luis", "Rodríguez", "33333333C");
        Patient p4 = crearPaciente("paciente4", "Marta", "Sánchez", "44444444D");
        Patient p5 = crearPaciente("paciente5", "Elena", "Belmonte", "55555555E");
        Patient p6 = crearPaciente("paciente6", "Roberto", "Gómez", "66666666F");
        Patient p7 = crearPaciente("paciente7", "Lucía", "Pascual", "77777777G");
        Patient p8 = crearPaciente("paciente8", "Diego", "Moreno", "88888888H");
        Patient p9 = crearPaciente("paciente9", "Carmen", "Ortiz", "99999999I");
        Patient p10 = crearPaciente("paciente10", "Sergio", "Navarro", "10101010J");

        // 4. CITAS INICIALES (Para probar cancelaciones)
        // Cita de Juan con House (Mañana) - Esta es la que usaremos para probar el
        // algoritmo
        crearCita(house, p1, LocalDateTime.now().plusDays(2).withHour(10).withMinute(0), AppointmentStatus.ASSIGNED);
        // Cita de Luis con Shepherd (Tarde)
        crearCita(shepherd, p3, LocalDateTime.now().plusDays(2).withHour(17).withMinute(0), AppointmentStatus.ASSIGNED);
        // Cita de Marta con Melendez
        crearCita(melendez, p4, LocalDateTime.now().plusDays(1).withHour(11).withMinute(0), AppointmentStatus.ASSIGNED);

        // Citas completadas en el pasado
        crearCita(house, p1, LocalDateTime.now().minusDays(5).withHour(10).withMinute(0), AppointmentStatus.COMPLETED);
        crearCita(grey, p2, LocalDateTime.now().minusDays(3).withHour(9).withMinute(0), AppointmentStatus.COMPLETED);

        // 4.1. BLOQUEO DEL DOCTOR
        // Bloqueo de House para mañana a las 11:00 por conferencia
        crearBloqueo(house, LocalDateTime.now().plusDays(1).withHour(11).withMinute(0), "Conferencia");

        // 5. LISTA DE ESPERA (Candidatos para el hueco de House en CARDIOLOGY)

        // Candidata A: Ana (Media Urgencia, prefiere Mañana, pidió hace 3 días)
        crearListaEspera(p2, Specialty.CARDIOLOGY, UrgencyLevel.MEDIUM, TimePreference.MORNING, 3);

        // Candidata B: Elena (ALTA Urgencia, prefiere Mañana, pidió hace 1 día)
        // DEBERÍA GANAR ESTA por Urgencia, aunque pidió después que Ana.
        crearListaEspera(p5, Specialty.CARDIOLOGY, UrgencyLevel.HIGH, TimePreference.MORNING, 1);

        // Candidato C: Roberto (Baja Urgencia, prefiere Tarde)
        // NO DEBERÍA GANAR porque prefiere tarde y el hueco es de mañana.
        crearListaEspera(p6, Specialty.CARDIOLOGY, UrgencyLevel.LOW, TimePreference.AFTERNOON, 5);

        System.out.println("--- ✅ CARGA COMPLETADA: 5 Médicos, 10 Pacientes y Listas de Espera listas ---");
    }

    private User crearUsuario(String username, String pass, Role role) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(pass));
        u.setRole(role);
        u.setEnabled(true);
        return userRepository.save(u);
    }

    private Doctor crearDoctor(String user, String nom, String ape, Specialty spec, WorkShift shift) {
        User u = crearUsuario(user, "doc123", Role.DOCTOR);

        Doctor d = new Doctor();
        d.setFirstName(nom);
        d.setLastName(ape);
        d.setSpecialty(spec);
        d.setWorkShift(shift);
        d.setEmail(user + "@hospital.com");
        d.setPhone("600000000");

        String numeroAleatorio = String.format("%06d", (int) (Math.random() * 1000000));
        d.setLicenseNumber("MED-" + numeroAleatorio);

        d.setUser(entityManager.merge(u));

        return doctorRepository.save(d);
    }

    private Patient crearPaciente(String user, String nom, String ape, String dni) {
        User u = crearUsuario(user, "1234", Role.PATIENT);

        Patient p = new Patient();
        p.setFirstName(nom);
        p.setLastName(ape);
        p.setDocumentId(dni);
        p.setBirthDate(LocalDate.of(1990, 1, 1));
        p.setGender(Gender.OTHER);
        p.setAddress("Calle Test");
        p.setEmail(user + "@test.com");
        p.setPhone("600000000");

        p.setUser(entityManager.merge(u));

        return patientRepository.save(p);
    }

    private void crearCita(Doctor d, Patient p, LocalDateTime start, AppointmentStatus status) {
        Appointment a = new Appointment();
        a.setDoctor(d);
        a.setPatient(p);
        a.setStartTime(start);
        a.setDurationMinutes(60);
        a.setStatus(status);
        appointmentRepository.save(a);
    }

    private void crearListaEspera(Patient p, Specialty s, UrgencyLevel urg, TimePreference pref, int diasAtras) {
        WaitingList w = new WaitingList();
        w.setPatient(p);
        w.setSpecialty(s);
        w.setUrgency(urg);
        w.setTimePreference(pref);
        w.setExpectedDurationMinutes(60);

        LocalDateTime requestDate = LocalDateTime.now().minusDays(diasAtras);
        w.setRequestDate(requestDate);

        w.setPreferredDate(requestDate.toLocalDate());

        waitingListRepository.save(w);
    }

    private void crearBloqueo(Doctor d, LocalDateTime start, String reason) {
        Appointment bloqueo = new Appointment();
        bloqueo.setDoctor(d);
        bloqueo.setStartTime(start);
        bloqueo.setDurationMinutes(60);
        bloqueo.setStatus(AppointmentStatus.BLOCKED);
        bloqueo.setNotes(reason);
        appointmentRepository.save(bloqueo);
    }

}