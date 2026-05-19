package com.autocita.backend.appointment;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.transaction.Transactional;

@Component
@EnableScheduling
public class AppointmentScheduler {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AppointmentService appointmentService;

    // Se ejecuta cada minuto (60000 ms)
    // Las ofertas expiran después de 15 minutos sin respuesta
    @Transactional
    @Scheduled(fixedRate = 60000)
    public void checkExpiredOffers() {
        LocalDateTime limit = LocalDateTime.now().minusMinutes(15);

        // Buscamos citas que sigan en OFFERED y cuya oferta sea más antigua que 15
        // minutos
        List<Appointment> expiredAppointments = appointmentRepository
                .findByStatusAndOfferedAtBefore(AppointmentStatus.OFFERED, limit);

        for (Appointment app : expiredAppointments) {
            String patientEmail = app.getPatient() != null ? app.getPatient().getEmail() : "UNKNOWN";
            System.out.println("⏳ Oferta expirada para cita ID: " + app.getId() +
                    " - Sin respuesta en 15 minutos de paciente: " + patientEmail);

            // Cambiar estado a NOT_RESPONDED
            app.setStatus(AppointmentStatus.NOT_RESPONDED);
            appointmentRepository.save(app);

            System.out.println("🔄 Reasignando cita a siguiente candidato en lista de espera...");

            // Llamamos a la lógica de "rechazo" para que el algoritmo busque al siguiente
            appointmentService.handleReassignmentResponse(app.getId(), false, true);
        }
    }

    // Marca como COMPLETED las citas ASSIGNED cuya hora de fin
    // (startTime + 60 min de duración) ya ha pasado.
    @Transactional
    @Scheduled(fixedRate = 60000)
    public void completePastAppointments() {
        LocalDateTime limit = LocalDateTime.now().minusHours(1);

        List<Appointment> pastAssigned = appointmentRepository.findPastAssignedAppointments(limit);

        for (Appointment app : pastAssigned) {
            System.out.println("Cita COMPLETED automáticamente -> ID " + app.getId() +
                    " (paciente " + app.getPatient().getEmail() + ")");
            app.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(app);
        }
    }
}
