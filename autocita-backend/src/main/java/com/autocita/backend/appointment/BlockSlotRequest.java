package com.autocita.backend.appointment;

import lombok.Data;

@Data
public class BlockSlotRequest {
    private String reason;

    public BlockSlotRequest() {
    }

    public BlockSlotRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
