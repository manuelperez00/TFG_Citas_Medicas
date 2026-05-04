package com.autocita.backend.security;

import com.autocita.backend.dto.RegisterRequest;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationService authenticationService;

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            authenticationService.registerPatient(request);
            return ResponseEntity.ok("Usuario registrado exitosamente");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(Principal principal) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login exitoso");
        
        if (principal != null) {
            response.put("username", principal.getName());
        }
        
        return ResponseEntity.ok(response);
    }
    
}