package com.project.messenger.chat.security;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.messenger.chat.core.ChatException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.UUID;
import java.util.Set;

@Component
public class ActiveUserVerifier {
    private final RestClient client;

    public ActiveUserVerifier(@Value("${chat.identity.base-url}") String baseUrl) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        factory.setReadTimeout(Duration.ofSeconds(5));
        client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public void verify(Jwt jwt) {
        try {
            IdentityProfile profile = client.get().uri("/api/users/me")
                    .headers(headers -> headers.setBearerAuth(jwt.getTokenValue())).retrieve().body(IdentityProfile.class);
            if (profile == null || !UUID.fromString(jwt.getSubject()).equals(profile.uuid())) {
                throw new ChatException(HttpStatus.UNAUTHORIZED, "Account verification failed");
            }
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 401 || exception.getStatusCode().value() == 404) {
                throw new ChatException(HttpStatus.UNAUTHORIZED, "Account is not active");
            }
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service unavailable");
        } catch (RestClientException exception) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service unavailable");
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record IdentityProfile(UUID uuid) { }

    public void verifyParticipants(Set<UUID> participants, String accessToken) {
        try {
            ParticipantResponse response = client.post().uri("/internal/users/validate-participants")
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .body(new ParticipantRequest(Set.copyOf(participants))).retrieve().body(ParticipantResponse.class);
            if (response == null || response.allActive() == null) {
                throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Invalid identity service response");
            }
            if (!response.allActive()) {
                throw new ChatException(HttpStatus.BAD_REQUEST, "One or more participants do not exist or are inactive");
            }
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 401 || exception.getStatusCode().value() == 403
                    || exception.getStatusCode().value() == 404) {
                // A missing route (404) signals deployment/configuration failure, not a missing participant.
                if (exception.getStatusCode().value() == 404) {
                    throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Identity participant validation unavailable");
                }
                throw new ChatException(HttpStatus.UNAUTHORIZED, "Account verification failed");
            }
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Identity participant validation unavailable");
        } catch (RestClientException exception) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Identity participant validation unavailable");
        }
    }

    public record ParticipantRequest(Set<UUID> userUuids) { }
    public record ParticipantResponse(Boolean allActive) { }
}
