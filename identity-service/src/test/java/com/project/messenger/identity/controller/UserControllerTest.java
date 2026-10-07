package com.project.messenger.identity.controller;

import com.project.messenger.identity.config.JwtConfig;
import com.project.messenger.identity.config.SecurityConfig;
import com.project.messenger.identity.mapper.UserMapper;
import com.project.messenger.identity.model.User;
import com.project.messenger.identity.repository.UserRepository;
import com.project.messenger.identity.security.jwt.JwtService;
import com.project.messenger.identity.security.jwt.JwtTestSupport;
import com.project.messenger.identity.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

class UserControllerTest {

    private static final String UPDATE = """
            {"username":"alice_updated","email":"alice_updated@example.com",
             "dateOfBirth":"2000-01-01","phoneNumber":"1234567890"}
            """;
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private UserRepository repository;
    private User user;
    private String token;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(WebTestConfig.class);
        context.refresh();
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
        repository = context.getBean(UserRepository.class);
        user = new User();
        user.setId(7L);
        user.setUuid(UUID.randomUUID());
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setDateOfBirth(LocalDate.of(2000, 1, 1));
        user.setPhoneNumber("1234567890");
        user.setPassword(context.getBean(PasswordEncoder.class).encode("test-password"));
        when(repository.findByUuidAndDeletedFalse(any(UUID.class))).thenAnswer(call ->
                user.getUuid().equals(call.getArgument(0)) && !user.isDeleted() ? Optional.of(user) : Optional.empty());
        when(repository.saveAndFlush(any(User.class))).thenAnswer(call -> call.getArgument(0));
        token = token(Clock.systemUTC());
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void readUsesSignedSubjectAndNeverExposesPasswordOrInternalFields() throws Exception {
        UUID spoofedUuid = UUID.randomUUID();
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token)
                        .param("uuid", spoofedUuid.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.uuid").value(user.getUuid().toString()))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.deleted").doesNotExist()).andExpect(header().string("Cache-Control", "no-store"));
        verify(repository).findByUuidAndDeletedFalse(user.getUuid());
        verify(repository, never()).findByUuidAndDeletedFalse(spoofedUuid);
    }

    @Test
    void updateUsesSignedSubjectAndPreservesOmittedPassword() throws Exception {
        UUID spoofedUuid = UUID.randomUUID();
        String originalHash = user.getPassword();
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token)
                        .param("uuid", spoofedUuid.toString()).contentType(MediaType.APPLICATION_JSON).content(UPDATE))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("alice_updated"))
                .andExpect(jsonPath("$.uuid").value(user.getUuid().toString()))
                .andExpect(jsonPath("$.password").doesNotExist());
        assertEquals(originalHash, user.getPassword());
        verify(repository).saveAndFlush(user);
        verify(repository, never()).findByUuidAndDeletedFalse(spoofedUuid);
    }

    @Test
    void deleteRequiresPasswordAndOldTokenCannotPerformAnySelfOperationAfterDeletion() throws Exception {
        UUID spoofedUuid = UUID.randomUUID();
        mvc.perform(delete("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.detail").value("Invalid credentials"));
        assertFalse(user.isDeleted());
        mvc.perform(delete("/api/users/me").header("Authorization", "Bearer " + token)
                        .param("uuid", spoofedUuid.toString()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"test-password\"}"))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        assertTrue(user.isDeleted());
        assertNotNull(user.getDeletedAt());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"test-password\"}"))
                .andExpect(status().isNotFound());
        verify(repository, never()).delete(any(User.class));
        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).findByUuidAndDeletedFalse(spoofedUuid);
    }

    @ParameterizedTest
    @ValueSource(strings = {"GET", "PATCH", "DELETE"})
    void anonymousCallerCannotUseSelfOperations(String method) throws Exception {
        mvc.perform(request(HttpMethod.valueOf(method), "/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON).content(UPDATE))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(repository);
    }

    @ParameterizedTest
    @ValueSource(strings = {"malformed", "expired", "different-key"})
    void invalidJwtIsRejectedBeforeController(String scenario) throws Exception {
        String invalidToken = switch (scenario) {
            case "expired" -> token(Clock.offset(Clock.systemUTC(), Duration.ofMinutes(-30)));
            case "different-key" -> new JwtService(new JwtConfig().jwtEncoder(JwtTestSupport.generateKeyPair()),
                    JwtTestSupport.properties(), Clock.systemUTC()).issueToken(user.getUuid()).accessToken();
            default -> "not-a-jwt";
        };
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(repository);
    }

    @Test
    void listOtherUserAndUnsupportedMethodsRemainDeniedWithValidJwt() throws Exception {
        String otherUserPath = "/api/users/" + UUID.randomUUID();
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());
        for (String method : new String[]{"GET", "PATCH", "DELETE"}) {
            mvc.perform(request(HttpMethod.valueOf(method), otherUserPath).header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isForbidden());
        }
        mvc.perform(put("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(UPDATE)).andExpect(status().isForbidden());
        verifyNoInteractions(repository);
    }

    @Test
    void patchOnlyEmailPreservesOtherFields() throws Exception {
        String originalHash = user.getPassword();
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"new@example.com\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("new@example.com"))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.phoneNumber").value("1234567890"));
        assertEquals(LocalDate.of(2000, 1, 1), user.getDateOfBirth());
        assertEquals(originalHash, user.getPassword());
        verify(repository, never()).existsByUsernameAndIdNot(any(), any());
        verify(repository, never()).existsByPhoneNumberAndIdNot(any(), any());
    }

    @Test
    void patchNullFieldsPreservesExistingValues() throws Exception {
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":null,\"dateOfBirth\":null}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("alice@example.com"));
        assertEquals(LocalDate.of(2000, 1, 1), user.getDateOfBirth());
    }

    @Test
    void invalidUpdateAndDeleteRequestsDoNotReachService() throws Exception {
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\" \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/users/me").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\" \"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(repository);
    }

    private String token(Clock clock) {
        return new JwtService(new JwtConfig().jwtEncoder(JwtTestSupport.KEY_PAIR), JwtTestSupport.properties(), clock)
                .issueToken(user.getUuid()).accessToken();
    }

    @Test
    void participantValidationReportsOnlyBooleanAndCountsActiveAccounts() throws Exception {
        UUID other = UUID.randomUUID();
        var ids = java.util.Set.of(user.getUuid(), other);
        String request = "{\"userUuids\":[\"" + user.getUuid() + "\",\"" + other + "\"]}";
        when(repository.countByUuidInAndDeletedFalse(ids)).thenReturn(2L);
        mvc.perform(post("/internal/users/validate-participants").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk()).andExpect(jsonPath("$.allActive").value(true))
                .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.userUuids").doesNotExist());
        when(repository.countByUuidInAndDeletedFalse(ids)).thenReturn(1L);
        mvc.perform(post("/internal/users/validate-participants").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk()).andExpect(jsonPath("$.allActive").value(false));
    }

    @Test
    void participantValidationRequiresActiveAuthenticatedCallerAndNonEmptyBatch() throws Exception {
        mvc.perform(post("/internal/users/validate-participants").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userUuids\":[\"" + user.getUuid() + "\"]}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/internal/users/validate-participants").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"userUuids\":[]}"))
                .andExpect(status().isBadRequest());
        user.setDeleted(true);
        mvc.perform(post("/internal/users/validate-participants").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"userUuids\":[\"" + user.getUuid() + "\"]}"))
                .andExpect(status().isNotFound());
        verify(repository, never()).countByUuidInAndDeletedFalse(any());
    }

    @Test
    void usernameResolutionRequiresAuthenticationAndReturnsOnlyPublicIdentifiers() throws Exception {
        when(repository.findByUsernameAndDeletedFalse("alice")).thenReturn(Optional.of(user));
        mvc.perform(post("/api/users/resolve-usernames").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usernames\":[\"alice\"]}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/users/resolve-usernames").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"usernames\":[\"alice\",\"alice\"]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].uuid").value(user.getUuid().toString()))
                .andExpect(jsonPath("$[0].username").value("alice"))
                .andExpect(jsonPath("$[0].email").doesNotExist())
                .andExpect(jsonPath("$[0].phoneNumber").doesNotExist())
                .andExpect(jsonPath("$[0].dateOfBirth").doesNotExist())
                .andExpect(jsonPath("$[0].password").doesNotExist())
                .andExpect(header().string("Cache-Control", "no-store"));
        verify(repository, times(1)).findByUsernameAndDeletedFalse("alice");
    }

    @Test
    void usernameResolutionRejectsMissingInactiveAndInvalidUsers() throws Exception {
        mvc.perform(post("/api/users/resolve-usernames").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"usernames\":[\"missing\"]}"))
                .andExpect(status().isNotFound());
        for (String body : new String[]{"{\"usernames\":[]}", "{\"usernames\":[null]}", "{\"usernames\":[\"bad name\"]}"}) {
            mvc.perform(post("/api/users/resolve-usernames").header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        user.setDeleted(true);
        mvc.perform(post("/api/users/resolve-usernames").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"usernames\":[\"alice\"]}"))
                .andExpect(status().isNotFound());
        verify(repository, never()).findByUsernameAndDeletedFalse("alice");
    }

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, UserController.class, ParticipantValidationController.class, ApiExceptionHandler.class})
    static class WebTestConfig {
        @Bean
        UserRepository userRepository() {
            return mock(UserRepository.class);
        }

        @Bean
        PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder(4);
        }

        @Bean
        UserService userService(UserRepository repository, PasswordEncoder encoder) {
            return new UserService(repository, new UserMapper(), encoder);
        }

        @Bean
        JwtDecoder jwtDecoder() {
            return new JwtConfig().jwtDecoder(JwtTestSupport.KEY_PAIR, JwtTestSupport.properties());
        }
    }
}
