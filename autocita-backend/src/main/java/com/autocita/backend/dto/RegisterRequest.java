package com.autocita.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    // Datos Login
    private String username;
    private String password;

    // Datos Patitent
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String documentId;
    private String address;
    
    private LocalDate birthDate;
    private String gender;
}
