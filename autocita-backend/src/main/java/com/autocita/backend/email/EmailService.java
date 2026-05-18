package com.autocita.backend.email;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.patient.Patient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${app.from.email:onboarding@resend.dev}")
    private String fromEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean sendReassignmentNotification(Patient patient, Appointment appointment, String acceptToken,
            String rejectToken) {
        try {
            if (patient.getEmail().endsWith("@test.com")) {
                System.out.println("⏭️  Email de PRUEBA detectado: " + patient.getEmail() +
                        " - No se enviará notificación.");
                return false;
            }

            if (resendApiKey == null || resendApiKey.isBlank()) {
                System.out.println("❌ RESEND_API_KEY no configurado. No se enviará email.");
                return false;
            }

            String appointmentDate = appointment.getStartTime().toLocalDate().toString();
            String appointmentTime = String.format("%02d:%02d",
                    appointment.getStartTime().getHour(),
                    appointment.getStartTime().getMinute());

            String patientFullName = patient.getFirstName() + " " + patient.getLastName();
            String subject = "¡Te tenemos una cita disponible! - AutoCita";

            String emailContent = buildEmailContent(patientFullName, appointment,
                    appointmentDate, appointmentTime, acceptToken, rejectToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = Map.of(
                    "from", "AutoCita <" + fromEmail + ">",
                    "to", List.of(patient.getEmail()),
                    "subject", subject,
                    "text", emailContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            System.out.println("📧 Enviando email a: " + patient.getEmail());
            System.out.println("   Paciente: " + patientFullName);
            System.out.println("   Médico: " + appointment.getDoctor().getFirstName() + " "
                    + appointment.getDoctor().getLastName());
            System.out.println("   Especialidad: " + appointment.getDoctor().getSpecialty());
            System.out.println("   Fecha: " + appointmentDate + " a las " + appointmentTime);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.resend.com/emails", request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Email ENVIADO EXITOSAMENTE a: " + patient.getEmail());
                return true;
            } else {
                System.out.println("❌ Resend devolvió estado: " + response.getStatusCode());
                return false;
            }

        } catch (Exception e) {
            System.out.println("❌ ERROR ENVIANDO EMAIL a " + patient.getEmail());
            System.out.println("   Detalles: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String buildEmailContent(String patientName, Appointment appointment,
            String date, String time, String acceptToken, String rejectToken) {
        String doctorFullName = appointment.getDoctor().getFirstName() + " " + appointment.getDoctor().getLastName();
        String specialty = appointment.getDoctor().getSpecialty().toString();

        String acceptUrl = backendUrl + "/api/appointments/respond-via-email?token=" + acceptToken + "&accepted=true";
        String rejectUrl = backendUrl + "/api/appointments/respond-via-email?token=" + rejectToken + "&accepted=false";

        String expiryNote;
        if (appointment.getOfferedAt() != null) {
            java.time.LocalDateTime exp = appointment.getOfferedAt().plusMinutes(15);
            expiryNote = String.format(
                "⏰ IMPORTANTE: Tienes 15 minutos para confirmar esta cita (hasta las %02d:%02d).",
                exp.getHour(), exp.getMinute());
        } else {
            expiryNote = "⏰ IMPORTANTE: Tienes 15 minutos para confirmar esta cita.";
        }

        return String.format(
                "Hola %s,\n\n" +
                        "¡Buenas noticias! Hemos encontrado una cita disponible que se ajusta a tus preferencias.\n\n" +
                        "📋 DETALLES DE LA CITA:\n" +
                        "  • Especialidad: %s\n" +
                        "  • Médico: Dr./Dra. %s\n" +
                        "  • Fecha: %s\n" +
                        "  • Hora: %s\n\n" +
                        "%s\n\n" +
                        "RESPONDE DIRECTAMENTE DESDE ESTE EMAIL:\n" +
                        "  ✅ ACEPTAR:  %s\n" +
                        "  ❌ RECHAZAR: %s\n\n" +
                        "Si no puedes hacer clic en los enlaces, ve a tu plataforma AutoCita y responde desde tu panel de notificaciones.\n\n" +
                        "Saludos cordiales,\nEquipo AutoCita",
                patientName, specialty, doctorFullName, date, time, expiryNote, acceptUrl, rejectUrl);
    }
}
