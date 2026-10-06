package com.project.messenger.chat.security;

import com.project.messenger.chat.core.ChatException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;

class ActiveUserVerifierTest {
    HttpServer server;
    ActiveUserVerifier verifier;
    AtomicInteger status = new AtomicInteger(200);
    AtomicReference<String> authorization = new AtomicReference<>();
    AtomicReference<String> body = new AtomicReference<>();
    AtomicReference<String> submitted = new AtomicReference<>();
    UUID uuid = UUID.randomUUID();
    @BeforeEach
    void setup() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        body.set("{\"uuid\":\"" + uuid + "\",\"username\":\"alice\",\"email\":\"alice@example.com\"}");
        server.createContext("/api/users/me", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] response = body.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status.get(), response.length);
            try (var output = exchange.getResponseBody()) { output.write(response); }
        });
        server.createContext("/internal/users/validate-participants", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            submitted.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = body.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status.get(), response.length);
            try (var output = exchange.getResponseBody()) { output.write(response); }
        });
        server.start();
        verifier = new ActiveUserVerifier("http://127.0.0.1:" + server.getAddress().getPort());
    }
    @AfterEach void close() { server.stop(0); }
    @Test
    void forwardsBearerAndReadsProfileWithoutDependingOnPrivateUserFields() {
        assertDoesNotThrow(() -> verifier.verify(token()));
        assertEquals("Bearer test-token", authorization.get());
    }
    @Test
    void missingDeletedWrongSubjectAndUnavailableIdentityFailClosed() {
        status.set(404);
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ChatException.class, () -> verifier.verify(token())).getStatus());
        status.set(503);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, assertThrows(ChatException.class, () -> verifier.verify(token())).getStatus());
        status.set(200); body.set("{\"uuid\":\"" + UUID.randomUUID() + "\"}");
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ChatException.class, () -> verifier.verify(token())).getStatus());
    }
    Jwt token() {
        return Jwt.withTokenValue("test-token").header("alg", "RS256").subject(uuid.toString())
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(900)).build();
    }
    @Test
    void participantValidationForwardsTokenAndRejectsFalseMissingOrUnavailableResponse() {
        body.set("{\"allActive\":true}");
        assertDoesNotThrow(() -> verifier.verifyParticipants(java.util.Set.of(uuid), "test-token"));
        assertEquals("Bearer test-token", authorization.get());
        assertTrue(submitted.get().contains(uuid.toString()));
        assertTrue(submitted.get().contains("userUuids"));
        body.set("{\"allActive\":false}");
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ChatException.class,
                () -> verifier.verifyParticipants(java.util.Set.of(uuid), "test-token")).getStatus());
        body.set("{}");
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, assertThrows(ChatException.class,
                () -> verifier.verifyParticipants(java.util.Set.of(uuid), "test-token")).getStatus());
        status.set(503);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, assertThrows(ChatException.class,
                () -> verifier.verifyParticipants(java.util.Set.of(uuid), "test-token")).getStatus());
    }
}
