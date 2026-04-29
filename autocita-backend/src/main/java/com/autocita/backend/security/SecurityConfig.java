package com.autocita.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);

        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("http://localhost:3000"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .authorizeHttpRequests(auth -> auth
                        // 1. Endpoints públicos (Login y Registro)
                        .requestMatchers("/api/auth/**").permitAll()

                        // 2. Seguridad para PACIENTES
                        // Solo pacientes pueden cancelar sus propias citas o ver/editar su perfil
                        .requestMatchers("/api/patients/my-id", "/api/patients/me", "/api/patients/perfil")
                        .hasRole("PATIENT")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/patients/me").hasRole("PATIENT")
                        .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/patients/me")
                        .hasRole("PATIENT")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/patients/me")
                        .hasRole("PATIENT")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/patients/*").hasRole("PATIENT")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/appointments/*/cancel")
                        .hasRole("PATIENT")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/appointments/*/respond-offer")
                        .hasRole("PATIENT")

                        // 3. Seguridad para MÉDICOS
                        // Solo médicos pueden confirmar o rechazar solicitudes o editar su perfil
                        .requestMatchers("/api/doctors/my-id", "/api/doctors/me").hasRole("DOCTOR")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/doctors/me").hasRole("DOCTOR")
                        .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/doctors/me").hasRole("DOCTOR")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/doctors/me").hasRole("DOCTOR")
                        .requestMatchers("/api/appointments/*/confirm").hasRole("DOCTOR")
                        .requestMatchers("/api/appointments/*/reject").hasRole("DOCTOR")

                        .anyRequest().authenticated())
                .httpBasic(org.springframework.security.config.Customizer.withDefaults());

        return http.build();
    }
}