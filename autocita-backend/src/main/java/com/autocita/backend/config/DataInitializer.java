package com.autocita.backend.config;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.appointment.AppointmentRepository;
import com.autocita.backend.appointment.AppointmentStatus;
import com.autocita.backend.doctor.Doctor;
import com.autocita.backend.doctor.DoctorRepository;
import com.autocita.backend.doctor.Specialty;
import com.autocita.backend.doctor.WorkShift;
import com.autocita.backend.medication.Medication;
import com.autocita.backend.medication.MedicationRepository;
import com.autocita.backend.patient.Gender;
import com.autocita.backend.patient.Patient;
import com.autocita.backend.patient.PatientRepository;
import com.autocita.backend.security.Role;
import com.autocita.backend.security.User;
import com.autocita.backend.security.UserRepository;
import com.autocita.backend.reassignmentLog.ReassignmentLog;
import com.autocita.backend.reassignmentLog.ReassignmentLogRepository;
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

    @Autowired
    private MedicationRepository medicationRepository;

    @Autowired
    private ReassignmentLogRepository reassignmentLogRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        try {
            waitingListRepository.deleteCorruptRecords();
        } catch (Exception e) {}

        if (medicationRepository.count() == 0) {
            crearMedicamento(
                "Ibuprofeno 600mg", "Ibuprofeno", "Antiinflamatorio",
                "1 comprimido cada 8 horas con comida",
                "Antiinflamatorio no esteroideo (AINE). Alivia el dolor leve-moderado, la fiebre y la inflamación.",
                "https://placehold.co/80x80/ef4444/ffffff?text=IBU"
            );
            crearMedicamento(
                "Amoxicilina 500mg", "Amoxicilina", "Antibiótico",
                "1 cápsula cada 8 horas durante 7-10 días",
                "Antibiótico de amplio espectro del grupo de las penicilinas. Trata infecciones bacterianas.",
                "https://placehold.co/80x80/3b82f6/ffffff?text=AMX"
            );
            crearMedicamento(
                "Omeprazol 20mg", "Omeprazol", "Antiácido",
                "1 cápsula en ayunas, 30 min antes del desayuno",
                "Inhibidor de la bomba de protones. Reduce la producción de ácido gástrico y protege el estómago.",
                "https://placehold.co/80x80/8b5cf6/ffffff?text=OME"
            );
            crearMedicamento(
                "Paracetamol 1g", "Paracetamol", "Analgésico",
                "1 comprimido cada 6-8 horas (máx. 4 al día)",
                "Analgésico y antipirético. Alivia el dolor leve-moderado y reduce la fiebre sin afectar al estómago.",
                "https://placehold.co/80x80/f59e0b/ffffff?text=PAR"
            );
            crearMedicamento(
                "Loratadina 10mg", "Loratadina", "Antihistamínico",
                "1 comprimido al día",
                "Antihistamínico de segunda generación. Alivia los síntomas de alergia sin causar somnolencia.",
                "https://placehold.co/80x80/10b981/ffffff?text=LOR"
            );
            System.out.println("--- 5 medicamentos de prueba creados ---");
        }

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

        // Citas completadas y valoradas — House (Cardiología)
        crearCitaValorada(house, p1,  LocalDateTime.now().minusDays(5).withHour(10).withMinute(0),  5);
        crearCitaValorada(house, p2,  LocalDateTime.now().minusDays(12).withHour(9).withMinute(0),  4);
        crearCitaValorada(house, p3,  LocalDateTime.now().minusDays(20).withHour(11).withMinute(0), 4);
        crearCitaValorada(house, p4,  LocalDateTime.now().minusDays(30).withHour(10).withMinute(0), 3);
        crearCitaValorada(house, p5,  LocalDateTime.now().minusDays(45).withHour(9).withMinute(0),  5);

        // Citas completadas y valoradas — Grey (Digestivo)
        crearCitaValorada(grey, p6,  LocalDateTime.now().minusDays(3).withHour(9).withMinute(0),   3);
        crearCitaValorada(grey, p7,  LocalDateTime.now().minusDays(10).withHour(10).withMinute(0), 4);
        crearCitaValorada(grey, p8,  LocalDateTime.now().minusDays(18).withHour(9).withMinute(0),  5);
        crearCitaValorada(grey, p9,  LocalDateTime.now().minusDays(28).withHour(10).withMinute(0), 2);
        crearCitaValorada(grey, p10, LocalDateTime.now().minusDays(40).withHour(9).withMinute(0),  4);

        // Citas completadas y valoradas — Shepherd (Dermatología)
        crearCitaValorada(shepherd, p1, LocalDateTime.now().minusDays(6).withHour(16).withMinute(0),  5);
        crearCitaValorada(shepherd, p3, LocalDateTime.now().minusDays(14).withHour(17).withMinute(0), 3);
        crearCitaValorada(shepherd, p5, LocalDateTime.now().minusDays(22).withHour(16).withMinute(0), 4);
        crearCitaValorada(shepherd, p7, LocalDateTime.now().minusDays(35).withHour(17).withMinute(0), 4);
        crearCitaValorada(shepherd, p9, LocalDateTime.now().minusDays(50).withHour(16).withMinute(0), 4);

        // Citas completadas y valoradas — Wilson (Ginecología)
        crearCitaValorada(wilson, p2,  LocalDateTime.now().minusDays(7).withHour(17).withMinute(0),  2);
        crearCitaValorada(wilson, p4,  LocalDateTime.now().minusDays(15).withHour(16).withMinute(0), 3);
        crearCitaValorada(wilson, p6,  LocalDateTime.now().minusDays(25).withHour(17).withMinute(0), 4);
        crearCitaValorada(wilson, p8,  LocalDateTime.now().minusDays(38).withHour(16).withMinute(0), 2);
        crearCitaValorada(wilson, p10, LocalDateTime.now().minusDays(55).withHour(17).withMinute(0), 3);

        // Citas completadas y valoradas — Melendez (Pediatría) 
        crearCitaValorada(melendez, p1, LocalDateTime.now().minusDays(4).withHour(9).withMinute(0),   5);
        crearCitaValorada(melendez, p2, LocalDateTime.now().minusDays(11).withHour(10).withMinute(0), 5);
        crearCitaValorada(melendez, p3, LocalDateTime.now().minusDays(19).withHour(11).withMinute(0), 5);
        crearCitaValorada(melendez, p4, LocalDateTime.now().minusDays(33).withHour(9).withMinute(0),  4);
        crearCitaValorada(melendez, p5, LocalDateTime.now().minusDays(48).withHour(10).withMinute(0), 5);

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

        // ESTADÍSTICAS DE REASIGNACIÓN ─ HOUSE (doctor1): 5 aprovechados, 8 ofertas, 2 rechazadas, 1 sin respuesta, 1 sin candidatos
        Appointment hR1 = crearCitaReasignada(house, p2, LocalDateTime.now().minusDays(60).withHour(9).withMinute(0), 4);
        Appointment hR2 = crearCitaReasignada(house, p3, LocalDateTime.now().minusDays(55).withHour(10).withMinute(0), 5);
        Appointment hR3 = crearCitaReasignada(house, p5, LocalDateTime.now().minusDays(48).withHour(9).withMinute(0), 3);
        Appointment hR4 = crearCitaReasignada(house, p7, LocalDateTime.now().minusDays(40).withHour(10).withMinute(0), 5);
        Appointment hR5 = crearCitaReasignada(house, p9, LocalDateTime.now().minusDays(32).withHour(9).withMinute(0), 4);
        Appointment hF1 = crearCitaSlot(house, LocalDateTime.now().minusDays(28).withHour(10).withMinute(0));
        Appointment hF2 = crearCitaSlot(house, LocalDateTime.now().minusDays(21).withHour(9).withMinute(0));
        Appointment hF3 = crearCitaSlot(house, LocalDateTime.now().minusDays(14).withHour(10).withMinute(0));
        crearLog(hR1, p1,   p2,   "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(62));
        crearLog(hR2, p1,   p3,   "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(57));
        crearLog(hR3, p2,   p5,   "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(50));
        crearLog(hR4, p3,   p7,   "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(42));
        crearLog(hR5, p4,   p9,   "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(34));
        crearLog(hF1, p6,   p8,   "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(30));
        crearLog(hF1, p6,   p8,   "OFERTA_RECHAZADA",            LocalDateTime.now().minusDays(29));
        crearLog(hF1, p6,   p10,  "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(29));
        crearLog(hF1, p6,   p10,  "OFERTA_RECHAZADA",            LocalDateTime.now().minusDays(28));
        crearLog(hF2, p7,   p4,   "OFERTA_ENVIADA",              LocalDateTime.now().minusDays(23));
        crearLog(hF2, p7,   p4,   "NOT_RESPONDED",               LocalDateTime.now().minusDays(21));
        crearLog(hF3, null, null,  "SIN_CANDIDATOS_DISPONIBLES",  LocalDateTime.now().minusDays(14));

        // ESTADÍSTICAS DE REASIGNACIÓN ─ GREY (doctor2): 2 aprovechados, 3 ofertas, 1 rechazada
        Appointment gR1 = crearCitaReasignada(grey, p1, LocalDateTime.now().minusDays(58).withHour(9).withMinute(0), 3);
        Appointment gR2 = crearCitaReasignada(grey, p3, LocalDateTime.now().minusDays(45).withHour(10).withMinute(0), 4);
        Appointment gF1 = crearCitaSlot(grey, LocalDateTime.now().minusDays(30).withHour(9).withMinute(0));
        crearLog(gR1, p6, p1, "OFERTA_ENVIADA",   LocalDateTime.now().minusDays(60));
        crearLog(gR2, p7, p3, "OFERTA_ENVIADA",   LocalDateTime.now().minusDays(47));
        crearLog(gF1, p8, p5, "OFERTA_ENVIADA",   LocalDateTime.now().minusDays(32));
        crearLog(gF1, p8, p5, "OFERTA_RECHAZADA", LocalDateTime.now().minusDays(31));

        // ESTADÍSTICAS DE REASIGNACIÓN ─ SHEPHERD (doctor3): 1 aprovechado, 2 ofertas, 1 sin respuesta
        Appointment sR1 = crearCitaReasignada(shepherd, p2, LocalDateTime.now().minusDays(52).withHour(17).withMinute(0), 5);
        Appointment sF1 = crearCitaSlot(shepherd, LocalDateTime.now().minusDays(38).withHour(16).withMinute(0));
        crearLog(sR1, p3, p2, "OFERTA_ENVIADA",  LocalDateTime.now().minusDays(54));
        crearLog(sF1, p5, p6, "OFERTA_ENVIADA",  LocalDateTime.now().minusDays(40));
        crearLog(sF1, p5, p6, "NOT_RESPONDED",   LocalDateTime.now().minusDays(38));

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

    private void crearCitaValorada(Doctor d, Patient p, LocalDateTime start, int rating) {
        Appointment a = new Appointment();
        a.setDoctor(d);
        a.setPatient(p);
        a.setStartTime(start);
        a.setDurationMinutes(60);
        a.setStatus(AppointmentStatus.COMPLETED);
        a.setRating(rating);
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

    private void crearMedicamento(String nombre, String principioActivo, String categoria,
                                   String dosis, String descripcion, String imageUrl) {
        Medication m = new Medication();
        m.setName(nombre);
        m.setActiveIngredient(principioActivo);
        m.setCategory(categoria);
        m.setDosage(dosis);
        m.setDescription(descripcion);
        m.setImageUrl(imageUrl);
        medicationRepository.save(m);
    }

    private Appointment crearCitaReasignada(Doctor d, Patient p, LocalDateTime start, int rating) {
        Appointment a = new Appointment();
        a.setDoctor(d);
        a.setPatient(p);
        a.setStartTime(start);
        a.setDurationMinutes(60);
        a.setStatus(AppointmentStatus.COMPLETED);
        a.setRating(rating);
        a.setReassigned(true);
        return appointmentRepository.save(a);
    }

    private Appointment crearCitaSlot(Doctor d, LocalDateTime start) {
        Appointment a = new Appointment();
        a.setDoctor(d);
        a.setStartTime(start);
        a.setDurationMinutes(60);
        a.setStatus(AppointmentStatus.COMPLETED);
        return appointmentRepository.save(a);
    }

    private void crearLog(Appointment appt, Patient original, Patient nuevo, String reason, LocalDateTime timestamp) {
        ReassignmentLog log = new ReassignmentLog(appt, original, nuevo, reason);
        log.setTimestamp(timestamp);
        reassignmentLogRepository.save(log);
    }

}