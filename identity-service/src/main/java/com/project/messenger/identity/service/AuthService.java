package com.project.messenger.identity.service;

import com.project.messenger.identity.dto.authentication.AuthResponseDTO;
import com.project.messenger.identity.dto.authentication.LoginRequestDTO;
import com.project.messenger.identity.model.User;
import com.project.messenger.identity.repository.UserRepository;
import com.project.messenger.identity.security.jwt.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String dummyPasswordHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO authenticate(LoginRequestDTO request) {
        var candidates = userRepository.findActiveLoginCandidates(request.identifier());
        // No arbitrary selection when different fields match more than one active account.
        User user = candidates.size() == 1 && !candidates.getFirst().isDeleted() ? candidates.getFirst() : null;
        boolean passwordMatches;
        try {
            passwordMatches = passwordEncoder.matches(request.password(),
                    user == null ? dummyPasswordHash : user.getPassword());
        } catch (IllegalArgumentException exception) {
            throw new BadCredentialsException("Invalid credentials");
        }
        if (user == null || !passwordMatches) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return jwtService.issueToken(user.getUuid());
    }
}
