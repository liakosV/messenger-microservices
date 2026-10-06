package com.project.messenger.identity.controller;

import com.project.messenger.identity.config.JwtConfig;
import com.project.messenger.identity.config.SecurityConfig;
import com.project.messenger.identity.dto.authentication.AuthResponseDTO;
import com.project.messenger.identity.dto.authentication.LoginRequestDTO;
import com.project.messenger.identity.dto.user.UserReadDTO;
import com.project.messenger.identity.security.jwt.JwtTestSupport;
import com.project.messenger.identity.security.jwt.JwtService;
import com.project.messenger.identity.service.AuthService;
import com.project.messenger.identity.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.util.UUID;
import java.time.Clock;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

class AuthControllerTest {

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private AuthService authService;
    private UserService userService;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(WebTestConfig.class);
        context.refresh();
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
        authService = context.getBean(AuthService.class);
        userService = context.getBean(UserService.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void loginIsPublicWithoutCsrfOrSessionAndReturnsTokenOnly() throws Exception {
        when(authService.authenticate(any())).thenReturn(new AuthResponseDTO("access-token", "Bearer", 900));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"alice\",\"password\":\"test-password\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().doesNotExist("Set-Cookie"));
    }

    @Test
    void registrationIsPublicAndDoesNotExposePassword() throws Exception {
        var user = new UserReadDTO();
        user.setUuid(UUID.randomUUID());
        user.setUsername("alice");
        when(userService.createUser(any())).thenReturn(user);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"username":"alice","email":"alice@example.com","password":"test-password",
                 "dateOfBirth":"2000-01-01","phoneNumber":"1234567890"}
                """))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.uuid").value(user.getUuid().toString()))
                .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.id").doesNotExist());
    }

    @Test
    void invalidLoginBodyDoesNotReachServiceOrEchoPassword() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Invalid request fields or JSON"));
        verifyNoInteractions(authService);
    }

    @Test
    void badCredentialsReturnGenericProblem() throws Exception {
        when(authService.authenticate(any(LoginRequestDTO.class))).thenThrow(new BadCredentialsException("internal reason"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"alice\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.detail").value("Invalid credentials"));
    }

    @Test
    void otherPathsAreNotPublicAndMalformedBearerTokenIsRejected() throws Exception {
        mvc.perform(get("/api/auth/login")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").header("Authorization", "Bearer invalid-token")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized()).andExpect(content().contentType("application/problem+json"));
        verifyNoInteractions(authService, userService);
    }

    @Test
    void validSignedBearerTokenStillCannotAccessUnexposedUserOperations() throws Exception {
        var jwtService = new JwtService(new JwtConfig().jwtEncoder(JwtTestSupport.KEY_PAIR),
                JwtTestSupport.properties(), Clock.systemUTC());
        String token = jwtService.issueToken(UUID.randomUUID()).accessToken();
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.detail").value("Access denied"));
        verifyNoInteractions(authService, userService);
    }

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, AuthController.class, ApiExceptionHandler.class})
    static class WebTestConfig {
        @Bean
        UserService userService() {
            return mock(UserService.class);
        }

        @Bean
        AuthService authService() {
            return mock(AuthService.class);
        }

        @Bean
        JwtDecoder jwtDecoder() {
            return new JwtConfig().jwtDecoder(JwtTestSupport.KEY_PAIR, JwtTestSupport.properties());
        }
    }
}
