package com.autocita.backend.appointment;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentRequest {

    private Integer doctorId;

    private Integer patientId;

    @NotNull(message = "La fecha es obligatoria")
    @Future(message = "La cita no puede ser en el pasado. Elige una fecha futura.")
    private LocalDateTime startTime;
}