package com.project.messenger.chat.websocket;

import com.project.messenger.chat.security.ActiveUserVerifier;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.*;
import tools.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Receive-only notifications. Writes use the REST API with membership/ownership checks. */
@Component @RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {
    private final JwtDecoder decoder;
    private final ActiveUserVerifier verifier;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, Connection> connections = new ConcurrentHashMap<>();
    private record Connection(WebSocketSession session, Jwt jwt) { }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        session.setTextMessageSizeLimit(16_384);
        // Close sockets that never authenticate instead of keeping anonymous subscriptions.
        java.util.concurrent.CompletableFuture.delayedExecutor(10, java.util.concurrent.TimeUnit.SECONDS).execute(() -> {
            if (!connections.containsKey(session.getId())) close(session);
        });
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (connections.containsKey(session.getId()) || !message.getPayload().startsWith("Bearer ")) { close(session); return; }
        try {
            Jwt jwt = decoder.decode(message.getPayload().substring(7));
            if (!jwt.getExpiresAt().isAfter(Instant.now())) { close(session); return; }
            verifier.verify(jwt);
            var connection = new Connection(new ConcurrentWebSocketSessionDecorator(session, 5000, 65536), jwt);
            connections.put(session.getId(), connection);
            connection.session().sendMessage(new TextMessage("{\"type\":\"AUTHENTICATED\"}"));
            long lifetime = Math.max(1, java.time.Duration.between(Instant.now(), jwt.getExpiresAt()).toMillis());
            java.util.concurrent.CompletableFuture.delayedExecutor(lifetime, java.util.concurrent.TimeUnit.MILLISECONDS).execute(() -> {
                if (connections.remove(session.getId(), connection)) close(session);
            });
        } catch (RuntimeException exception) { close(session); }
    }

    @TransactionalEventListener
    public void deliver(ChatEvent event) {
        String payload = objectMapper.writeValueAsString(new Notification(event.type(), event.conversationUuid(), event.messageUuid(), event.message()));
        for (var entry : connections.entrySet()) {
            Connection connection = entry.getValue();
            if (!event.recipients().contains(UUID.fromString(connection.jwt().getSubject()))) continue;
            try {
                if (!connection.jwt().getExpiresAt().isAfter(Instant.now())) throw new IllegalStateException("Token expired");
                verifier.verify(connection.jwt());
                connection.session().sendMessage(new TextMessage(payload));
            } catch (Exception exception) { connections.remove(entry.getKey(), connection); close(connection.session()); }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { connections.remove(session.getId()); }
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) { connections.remove(session.getId()); close(session); }
    private static void close(WebSocketSession session) {
        try { session.close(CloseStatus.POLICY_VIOLATION); } catch (Exception ignored) { }
    }
    public record Notification(String type, UUID conversationUuid, UUID messageUuid, com.project.messenger.chat.dto.MessageReadDTO message) { }
}
