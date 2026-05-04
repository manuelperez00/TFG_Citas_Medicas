package com.autocita.backend.reassignmentLog;

import com.autocita.backend.appointment.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reassignment")
public class ReassignmentLogController {

    @Autowired
    private ReassignmentLogRepository reassignmentLogRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping("/doctor/{doctorId}/stats")
    public ResponseEntity<?> getDoctorReassignmentStats(@PathVariable Integer doctorId) {
        long ofertasEnviadas  = reassignmentLogRepository.countByAppointmentDoctorIdAndReason(doctorId, "OFERTA_ENVIADA");
        long rechazadas       = reassignmentLogRepository.countByAppointmentDoctorIdAndReason(doctorId, "OFERTA_RECHAZADA");
        long noRespondidas    = reassignmentLogRepository.countByAppointmentDoctorIdAndReason(doctorId, "NOT_RESPONDED");
        long sinCandidatos    = reassignmentLogRepository.countByAppointmentDoctorIdAndReason(doctorId, "SIN_CANDIDATOS_DISPONIBLES");
        long aprovechados     = appointmentRepository.countByDoctorIdAndIsReassignedTrue(doctorId);

        return ResponseEntity.ok(Map.of(
            "ofertasEnviadas",  ofertasEnviadas,
            "aprovechados",     aprovechados,
            "rechazadas",       rechazadas,
            "noRespondidas",    noRespondidas,
            "sinCandidatos",    sinCandidatos
        ));
    }

    @GetMapping("/doctor/{doctorId}/history")
    public ResponseEntity<?> getDoctorReassignmentHistory(@PathVariable Integer doctorId) {
        List<ReassignmentLog> logs = reassignmentLogRepository.findByAppointmentDoctorId(doctorId);

        List<Map<String, Object>> result = logs.stream().map(log -> {
            String originalName = log.getOriginalPatient() != null
                ? log.getOriginalPatient().getFirstName() + " " + log.getOriginalPatient().getLastName()
                : "-";
            String newName = log.getNewPatient() != null
                ? log.getNewPatient().getFirstName() + " " + log.getNewPatient().getLastName()
                : "-";
            return Map.<String, Object>of(
                "id",               log.getId(),
                "timestamp",        log.getTimestamp().toString(),
                "reason",           log.getReason(),
                "appointmentDate",  log.getAppointment().getStartTime().toString(),
                "originalPatient",  originalName,
                "newPatient",       newName
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
