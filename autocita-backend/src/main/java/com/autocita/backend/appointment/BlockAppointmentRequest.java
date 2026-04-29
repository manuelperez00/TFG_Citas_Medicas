package com.autocita.backend.appointment;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BlockAppointmentRequest {

    @NotNull(message = "La fecha de inicio es obligatoria")
    private String startTime; 

    @NotNull(message = "La fecha de fin es obligatoria")
    private String endTime;

    private String reason;

    // Parser para convertir String a LocalDateTime sin cambiar zona horaria
    public LocalDateTime getStartTimeAsLocalDateTime() {
        try {
            // Formato: "2026-04-09T09:00:00"
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            return LocalDateTime.parse(this.startTime, formatter);
        } catch (Exception e) {
            System.out.println("Error parsing startTime: " + this.startTime + " - " + e.getMessage());
            return null;
        }
    }

    public LocalDateTime getEndTimeAsLocalDateTime() {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            return LocalDateTime.parse(this.endTime, formatter);
        } catch (Exception e) {
            System.out.println("Error parsing endTime: " + this.endTime + " - " + e.getMessage());
            return null;
        }
    }

    // Validación personalizada: mínimo 24 horas desde ahora
    public boolean isValidMinimum24Hours() {
        LocalDateTime parsedStart = getStartTimeAsLocalDateTime();
        if (parsedStart == null) {
            System.out.println("No se pudo parsear startTime");
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime minimum = now.plusHours(24);

        // startTime debe ser estrictamente después de minimum + tolerancia
        LocalDateTime minimumWithTolerance = minimum.minusMinutes(5);

        boolean isValid = parsedStart.isAfter(minimumWithTolerance);
        System.out.println("BlockAppointmentRequest.isValidMinimum24Hours():");
        System.out.println("   now: " + now);
        System.out.println("   minimum (now + 24h): " + minimum);
        System.out.println("   startTime: " + parsedStart);
        System.out.println("   isValid: " + isValid);

        return isValid;
    }
}
