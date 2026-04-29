package com.autocita.backend.email;

import com.autocita.backend.appointment.Appointment;
import com.autocita.backend.patient.Patient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

        @Autowired(required = false)
        private JavaMailSender mailSender;


        // Envía email con oferta de cita y links para aceptar/rechazar
        public boolean sendReassignmentNotification(Patient patient, Appointment appointment, String acceptToken,
                        String rejectToken) {
                try {
                        // Validar si es un email de prueba (no enviar)
                        if (patient.getEmail().endsWith("@test.com")) {
                                System.out.println("⏭️  Email de PRUEBA detectado: " + patient.getEmail() +
                                                " - No se enviará notificación.");
                                System.out.println(
                                                "   (Agregar correos reales después de poblar la BD para que usuarios reales reciban notificaciones)");
                                return false;
                        }

                        if (mailSender == null) {
                                System.out.println(
                                                "❌ EmailService NO CONFIGURADO. Se requiere SMTP en application.properties");
                                return false;
                        }

                        String appointmentDate = appointment.getStartTime().toLocalDate().toString();
                        String appointmentTime = String.format("%02d:%02d",
                                        appointment.getStartTime().getHour(),
                                        appointment.getStartTime().getMinute());

                        String patientFullName = patient.getFirstName() + " " + patient.getLastName();
                        String subject = "🎉 ¡Te tenemos una cita disponible! - AutoCita";

                        String emailContent = buildEmailContent(
                                        patientFullName,
                                        appointment,
                                        appointmentDate,
                                        appointmentTime,
                                        acceptToken,
                                        rejectToken);

                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setTo(patient.getEmail());
                        message.setSubject(subject);
                        message.setText(emailContent);
                        message.setFrom("noreply@autocita.com");

                        System.out.println("📧 Enviando email a: " + patient.getEmail());
                        System.out.println("   Paciente: " + patientFullName);
                        System.out.println("   Médico: " + appointment.getDoctor().getFirstName() + " "
                                        + appointment.getDoctor().getLastName());
                        System.out.println("   Especialidad: " + appointment.getDoctor().getSpecialty());
                        System.out.println("   Fecha: " + appointmentDate + " a las " + appointmentTime);

                        mailSender.send(message);
                        System.out.println("✅ Email ENVIADO EXITOSAMENTE a: " + patient.getEmail());
                        return true;

                } catch (Exception e) {
                        System.out.println("❌ ERROR ENVIANDO EMAIL a " + patient.getEmail());
                        System.out.println("   Detalles: " + e.getMessage());
                        e.printStackTrace();
                        return false;
                }
        }

        /**
         * Construye el contenido HTML del email con botones de respuesta
         */
        private String buildEmailContent(String patientName, Appointment appointment,
                        String date, String time, String acceptToken, String rejectToken) {
                String doctorFirstName = appointment.getDoctor().getFirstName();
                String doctorLastName = appointment.getDoctor().getLastName();
                String doctorFullName = doctorFirstName + " " + doctorLastName;
                String specialty = appointment.getDoctor().getSpecialty().toString();

                // URLs para aceptar/rechazar desde el email
                String acceptUrl = "http://localhost:8080/api/appointments/respond-via-email?token=" + acceptToken
                                + "&accepted=true";
                String rejectUrl = "http://localhost:8080/api/appointments/respond-via-email?token=" + rejectToken
                                + "&accepted=false";

                return String.format(
                                "Hola %s,\n\n" +
                                                "¡Buenas noticias! Hemos encontrado una cita disponible que se ajusta a tus preferencias.\n\n"
                                                +
                                                "📋 DETALLES DE LA CITA:\n" +
                                                "  • Especialidad: %s\n" +
                                                "  • Médico: Dr./Dra. %s\n" +
                                                "  • Fecha: %s\n" +
                                                "  • Hora: %s\n\n" +
                                                "⏰ IMPORTANTE: Tienes 15 minutos para confirmar esta cita.\n\n" +
                                                "RESPONDE DIRECTAMENTE DESDE ESTE EMAIL:\n" +
                                                "  ✅ ACEPTAR:  %s\n" +
                                                "  ❌ RECHAZAR: %s\n\n" +
                                                "Si no puedes hacer clic en los enlaces, ve a tu plataforma AutoCita y responde desde tu panel de notificaciones.\n\n"
                                                +
                                                "Saludos cordiales,\nEquipo AutoCita",
                                patientName, specialty, doctorFullName, date, time, acceptUrl, rejectUrl);
        }
}
