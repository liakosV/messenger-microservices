package com.project.messenger.chat.controller;
import com.project.messenger.chat.config.*;
import com.project.messenger.chat.dto.*;
import com.project.messenger.chat.security.ActiveUserVerifier;
import com.project.messenger.chat.service.*;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.security.*;
import java.security.interfaces.*;
import java.time.Instant;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

class ChatControllerTest {
    static KeyPair keys;
    static final String ISSUER = "https://identity.example.test";
    AnnotationConfigWebApplicationContext context;
    MockMvc mvc;
    ConversationService conversations;
    MessageService messages;
    ActiveUserVerifier verifier;
    UUID caller = UUID.randomUUID();
    String token;
    @BeforeAll
    static void keys() throws Exception { var g = KeyPairGenerator.getInstance("RSA"); g.initialize(2048); keys = g.generateKeyPair(); }
    @BeforeEach
    void setup() {
        context = new AnnotationConfigWebApplicationContext(); context.setServletContext(new MockServletContext());
        context.register(TestConfig.class); context.refresh();
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
        conversations = context.getBean(ConversationService.class); messages = context.getBean(MessageService.class);
        verifier = context.getBean(ActiveUserVerifier.class); token = token(ISSUER, Instant.now().plusSeconds(900));
    }
    @AfterEach void close() { context.close(); }
    @Test
    void missingMalformedExpiredAndWrongIssuerTokensFailBeforeServices() throws Exception {
        mvc.perform(get("/api/conversations")).andExpect(status().isUnauthorized());
        for (String bad : List.of("bad-token", token(ISSUER, Instant.now().minusSeconds(120)), token("https://wrong.test", Instant.now().plusSeconds(900)))) {
            mvc.perform(get("/api/conversations").header("Authorization", "Bearer " + bad)).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(conversations, messages, verifier);
    }
    @Test
    void actorAndSenderComeFromJwt() throws Exception {
        UUID conversation = UUID.randomUUID(), spoof = UUID.randomUUID();
        when(conversations.create(any(), eq(caller), eq(token))).thenReturn(new ConversationReadDTO(conversation, caller, Set.of(caller, spoof), null, null));
        mvc.perform(post("/api/conversations").header("Authorization", "Bearer " + token)
                        .param("userUuid", spoof.toString()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"participantUuids\":[\"" + spoof + "\"]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.creatorUuid").value(caller.toString()));
        verify(verifier).verify(any(Jwt.class));
        when(messages.send(eq(conversation), eq(caller), any())).thenReturn(new MessageReadDTO(UUID.randomUUID(), conversation, caller, "hello", null, null));
        mvc.perform(post("/api/conversations/" + conversation + "/messages").header("Authorization", "Bearer " + token)
                        .param("senderUuid", spoof.toString()).contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"hello\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.senderUuid").value(caller.toString()))
                .andExpect(jsonPath("$.password").doesNotExist());
    }
    @Test
    void inactiveCallerOrIdentityOutageCannotReachServices() throws Exception {
        doThrow(new com.project.messenger.chat.core.ChatException(org.springframework.http.HttpStatus.UNAUTHORIZED, "inactive"))
                .when(verifier).verify(any());
        mvc.perform(get("/api/conversations").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        doThrow(new com.project.messenger.chat.core.ChatException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "unavailable"))
                .when(verifier).verify(any());
        mvc.perform(get("/api/conversations").header("Authorization", "Bearer " + token)).andExpect(status().isServiceUnavailable());
        verifyNoInteractions(conversations, messages);
    }
    @Test
    void blankMessageAndInvalidPaginationAreRejected() throws Exception {
        mvc.perform(post("/api/conversations/" + UUID.randomUUID() + "/messages").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\" \"}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/conversations").header("Authorization", "Bearer " + token).param("size", "101"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(conversations, messages);
    }
    String token(String issuer, Instant expiry) {
        return NimbusJwtEncoder.withKeyPair((RSAPublicKey) keys.getPublic(), (RSAPrivateKey) keys.getPrivate()).build()
                .encode(JwtEncoderParameters.from(JwtClaimsSet.builder().subject(caller.toString()).issuer(issuer)
                        .issuedAt(Instant.now().minusSeconds(600)).expiresAt(expiry).build())).getTokenValue();
    }
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, ConversationController.class, MessageController.class, ApiExceptionHandler.class})
    static class TestConfig {
        @Bean ConversationService conversations() { return mock(ConversationService.class); }
        @Bean MessageService messages() { return mock(MessageService.class); }
        @Bean ActiveUserVerifier verifier() { return mock(ActiveUserVerifier.class); }
        @Bean JwtDecoder decoder() throws Exception {
            String pem = "-----BEGIN PUBLIC KEY-----\n" + Base64.getEncoder().encodeToString(keys.getPublic().getEncoded()) + "\n-----END PUBLIC KEY-----";
            return new JwtConfig().jwtDecoder(new ByteArrayResource(pem.getBytes(java.nio.charset.StandardCharsets.US_ASCII)), ISSUER);
        }
    }
}
