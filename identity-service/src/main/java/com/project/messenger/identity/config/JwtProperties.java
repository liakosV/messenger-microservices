package com.project.messenger.identity.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.io.Resource;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "identity.jwt")
public record JwtProperties(@NotNull Resource privateKey, @NotNull Resource publicKey,
                            @NotBlank String issuer, @NotNull Duration accessTokenTtl) {

    public JwtProperties {
        if (accessTokenTtl != null && (accessTokenTtl.isNegative() || accessTokenTtl.toSeconds() < 1)) {
            throw new IllegalArgumentException("JWT access token duration must be at least one second");
        }
    }
}
