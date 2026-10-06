package com.project.messenger.chat.websocket;
import com.project.messenger.chat.security.ActiveUserVerifier;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.socket.*;
import tools.jackson.databind.json.JsonMapper;
import java.time.Instant;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class ChatWebSocketTest {
    @Test
    void eventsReachOnlyAuthenticatedRecipients() throws Exception {
        JwtDecoder decoder = mock(JwtDecoder.class); ActiveUserVerifier verifier = mock(ActiveUserVerifier.class);
        UUID user = UUID.randomUUID();
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "RS256").subject(user.toString())
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(900)).build();
        when(decoder.decode("token")).thenReturn(jwt);
        WebSocketSession session = mock(WebSocketSession.class); when(session.getId()).thenReturn("session"); when(session.isOpen()).thenReturn(true);
        var handler = new ChatWebSocketHandler(decoder, verifier, JsonMapper.builder().build());
        handler.handleMessage(session, new TextMessage("Bearer token"));
        verify(session).sendMessage(any(TextMessage.class));
        handler.deliver(new ChatEvent("MESSAGE_DELETED", UUID.randomUUID(), UUID.randomUUID(), null, Set.of(UUID.randomUUID())));
        verify(session, times(1)).sendMessage(any(TextMessage.class));
        handler.deliver(new ChatEvent("MESSAGE_DELETED", UUID.randomUUID(), UUID.randomUUID(), null, Set.of(user)));
        verify(session, times(2)).sendMessage(any(TextMessage.class));
        verify(verifier, times(2)).verify(jwt);
    }
    @Test
    void unauthenticatedInputOrInvalidTokenClosesConnection() throws Exception {
        JwtDecoder decoder = mock(JwtDecoder.class);
        var handler = new ChatWebSocketHandler(decoder, mock(ActiveUserVerifier.class), JsonMapper.builder().build());
        WebSocketSession session = mock(WebSocketSession.class); when(session.getId()).thenReturn("session");
        handler.handleMessage(session, new TextMessage("hello")); verify(session).close(CloseStatus.POLICY_VIOLATION);
        when(decoder.decode("invalid")).thenThrow(new JwtException("invalid"));
        handler.handleMessage(session, new TextMessage("Bearer invalid")); verify(session, times(2)).close(CloseStatus.POLICY_VIOLATION);
        verify(session, never()).sendMessage(any());
    }
}
