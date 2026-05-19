package com.autocita.backend.appointment;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio auxiliar para cambiar el estado de un slot en una transacción
 * independiente (REQUIRES_NEW), de forma que el cambio sea visible para otras
 * transacciones antes de que termine el proceso de reasignación.
 *
 * Esto evita la ventana de ~6-8 s en que un slot aparece como AVAILABLE
 * mientras el algoritmo de reasignación todavía está en curso.
 */
@Service
public class SlotStatusService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    /**
     * Marca el slot como REASSIGNING y hace commit inmediato en una
     * transacción propia. El slot deja de aparecer como libre para cualquier
     * otro usuario en cuanto este método retorna.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Appointment markAsReassigning(Integer slotId) {
        Appointment slot = appointmentRepository.findById(slotId)
                .orElseThrow(() -> new EntityNotFoundException("Slot no encontrado: " + slotId));
        slot.setStatus(AppointmentStatus.REASSIGNING);
        return appointmentRepository.saveAndFlush(slot);
    }
}
