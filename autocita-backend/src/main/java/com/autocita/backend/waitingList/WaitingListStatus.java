package com.autocita.backend.waitingList;

public enum WaitingListStatus {
    ACTIVE("Activa"), // En espera de cita
    OFFERED("Ofrecida"), // Se ha ofrecido cita (en periodo de 15 min para responder)
    ACCEPTED("Aceptada"), // Paciente aceptó la cita
    REJECTED("Rechazada"), // Paciente rechazó la cita
    EXPIRED("Expirada"), // La fecha preferida pasó sin asignación
    CANCELLED("Cancelada"); // Paciente canceló manualmente

    private final String label;

    WaitingListStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
