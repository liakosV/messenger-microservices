package com.project.messenger.identity.service;

import com.project.messenger.identity.core.exception.AppObjectAlreadyExistsException;
import com.project.messenger.identity.core.exception.AppObjectNotFoundException;
import com.project.messenger.identity.core.exception.AppObjectUnauthorizedException;
import com.project.messenger.identity.dto.user.UserUpdateDTO;
import com.project.messenger.identity.mapper.UserMapper;
import com.project.messenger.identity.model.User;
import com.project.messenger.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class UserServiceTest {

    private UserRepository repository;
    private PasswordEncoder encoder;
    private UserService service;
    private User user;
    private UserUpdateDTO update;

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        service = new UserService(repository, new UserMapper(), encoder);
        user = new User();
        user.setId(7L);
        user.setUuid(UUID.randomUUID());
        user.setPassword("existing-hash");
        update = new UserUpdateDTO("alice", "alice@example.com", null,
                LocalDate.of(2000, 1, 1), "1234567890");
        when(repository.findByUuidAndDeletedFalse(user.getUuid())).thenReturn(Optional.of(user));
        when(repository.saveAndFlush(any(User.class))).thenAnswer(call -> call.getArgument(0));
    }

    @ParameterizedTest
    @ValueSource(strings = {"omitted", "same", "changed"})
    void updatePreservesOrEncodesPasswordAsNeeded(String scenario) {
        if (!scenario.equals("omitted")) {
            update.setPassword("supplied-password");
            when(encoder.matches("supplied-password", "existing-hash"))
                    .thenReturn(scenario.equals("same"));
            when(encoder.encode("supplied-password")).thenReturn("new-hash");
        }

        var result = service.updateUser(user.getUuid(), update);

        assertEquals(user.getUuid(), result.getUuid());
        assertEquals("alice", result.getUsername());
        assertEquals(scenario.equals("changed") ? "new-hash" : "existing-hash", user.getPassword());
        verify(repository).existsByUsernameAndIdNot("alice", 7L);
        verify(repository).existsByEmailAndIdNot("alice@example.com", 7L);
        verify(repository).existsByPhoneNumberAndIdNot("1234567890", 7L);
        if (scenario.equals("changed")) {
            verify(encoder).encode("supplied-password");
        } else {
            verify(encoder, never()).encode(anyString());
        }
        assertFalse(user.isDeleted());
    }

    @ParameterizedTest
    @ValueSource(strings = {"username", "email", "phone"})
    void updateRejectsIdentifiersReservedByAnotherAccount(String field) {
        switch (field) {
            case "username" -> when(repository.existsByUsernameAndIdNot("alice", 7L)).thenReturn(true);
            case "email" -> when(repository.existsByEmailAndIdNot("alice@example.com", 7L)).thenReturn(true);
            case "phone" -> when(repository.existsByPhoneNumberAndIdNot("1234567890", 7L)).thenReturn(true);
        }
        assertThrows(AppObjectAlreadyExistsException.class, () -> service.updateUser(user.getUuid(), update));
        assertEquals("existing-hash", user.getPassword());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void inactiveOrMissingUserCannotBeReadUpdatedOrDeleted() {
        when(repository.findByUuidAndDeletedFalse(user.getUuid())).thenReturn(Optional.empty());
        assertThrows(AppObjectNotFoundException.class, () -> service.getUserByUuid(user.getUuid()));
        assertThrows(AppObjectNotFoundException.class, () -> service.updateUser(user.getUuid(), update));
        assertThrows(AppObjectNotFoundException.class, () -> service.deleteCurrentUser(user.getUuid(), "password"));
        verifyNoInteractions(encoder);
    }

    @Test
    void wrongPasswordDoesNotSoftDeleteUser() {
        assertThrows(AppObjectUnauthorizedException.class,
                () -> service.deleteCurrentUser(user.getUuid(), "wrong-password"));
        assertFalse(user.isDeleted());
        assertNull(user.getDeletedAt());
    }

    @Test
    void correctPasswordSoftDeletesWithoutRemovingRowOrChangingHash() {
        when(encoder.matches("correct-password", "existing-hash")).thenReturn(true);
        service.deleteCurrentUser(user.getUuid(), "correct-password");
        assertTrue(user.isDeleted());
        assertNotNull(user.getDeletedAt());
        assertEquals("existing-hash", user.getPassword());
        verify(repository, never()).delete(any(User.class));
    }
}
