package com.project.messenger.identity.service;

import com.project.messenger.identity.dto.authentication.AuthResponseDTO;
import com.project.messenger.identity.dto.authentication.LoginRequestDTO;
import com.project.messenger.identity.model.User;
import com.project.messenger.identity.repository.UserRepository;
import com.project.messenger.identity.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository repository;
    private JwtService jwtService;
    private AuthService service;
    private User user;

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        jwtService = mock(JwtService.class);
        var encoder = new BCryptPasswordEncoder(4);
        service = new AuthService(repository, encoder, jwtService);
        user = new User();
        user.setUuid(UUID.randomUUID());
        user.setPassword(encoder.encode("test-password"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"alice", "alice@example.com", "+301234567890"})
    void acceptsAnyUniqueIdentifierWithCorrectPassword(String identifier) {
        when(repository.findActiveLoginCandidates(identifier)).thenReturn(List.of(user));
        var response = new AuthResponseDTO("issued-token", "Bearer", 900);
        when(jwtService.issueToken(user.getUuid())).thenReturn(response);
        assertEquals(response, service.authenticate(new LoginRequestDTO(identifier, "test-password")));
        verify(jwtService).issueToken(user.getUuid());
    }

    @ParameterizedTest
    @ValueSource(strings = {"missing", "wrong-password", "deleted", "ambiguous"})
    void failsGenericallyWithoutIssuingToken(String scenario) {
        user.setDeleted(scenario.equals("deleted"));
        User otherUser = new User();
        otherUser.setUuid(UUID.randomUUID());
        otherUser.setPassword(user.getPassword());
        List<User> candidates = switch (scenario) {
            case "missing" -> List.of();
            case "ambiguous" -> List.of(user, otherUser);
            default -> List.of(user);
        };
        when(repository.findActiveLoginCandidates("identifier")).thenReturn(candidates);
        String password = scenario.equals("wrong-password") ? "wrong" : "test-password";
        var exception = assertThrows(BadCredentialsException.class,
                () -> service.authenticate(new LoginRequestDTO("identifier", password)));
        assertEquals("Invalid credentials", exception.getMessage());
        verifyNoInteractions(jwtService);
    }
}
