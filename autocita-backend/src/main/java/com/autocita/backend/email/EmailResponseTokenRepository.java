package com.autocita.backend.email;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailResponseTokenRepository extends JpaRepository<EmailResponseToken, Integer> {
    Optional<EmailResponseToken> findByToken(String token);

    void deleteByToken(String token);
}
