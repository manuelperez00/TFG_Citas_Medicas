package com.autocita.backend.waitingList;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WaitingListResponse {
    private List<WaitingList> active; // ACTIVE
    private List<WaitingList> offered; // OFFERED (esperando respuesta)
    private List<WaitingList> accepted; // ACCEPTED (aceptada)
    private List<WaitingList> rejected; // REJECTED (rechazada)
    private List<WaitingList> expired; // EXPIRED (fecha pasó)
    private List<WaitingList> cancelled; // CANCELLED (cancelada por paciente)
}
