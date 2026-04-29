package com.autocita.backend.waitingList;

public enum UrgencyLevel {
    LOW(1),
    MEDIUM(2),
    HIGH(3);

    private final int priorityValue;

    UrgencyLevel(int priorityValue) {
        this.priorityValue = priorityValue;
    }

    public int getPriorityValue() {
        return priorityValue;
    }
}
