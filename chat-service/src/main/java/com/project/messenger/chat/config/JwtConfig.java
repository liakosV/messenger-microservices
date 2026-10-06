package com.project.messenger.chat.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.security.converter.RsaKeyConverters;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import java.util.UUID;

@Configuration
public class JwtConfig {
    @Bean
    public JwtDecoder jwtDecoder(@Value("${chat.jwt.public-key}") Resource publicKey,
                                 @Value("${chat.jwt.issuer}") String issuer) throws java.io.IOException {
        java.security.interfaces.RSAPublicKey key;
        try (var input = publicKey.getInputStream()) { key = RsaKeyConverters.x509().convert(input); }
        if (key == null || key.getModulus().bitLength() < 2048) throw new IllegalArgumentException("Invalid RSA public key");
        var decoder = NimbusJwtDecoder.withPublicKey(key).signatureAlgorithm(SignatureAlgorithm.RS256).build();
        OAuth2TokenValidator<Jwt> claims = jwt -> {
            try {
                if (jwt.getSubject() != null && UUID.fromString(jwt.getSubject()).toString().equals(jwt.getSubject())
                        && jwt.getIssuedAt() != null && jwt.getExpiresAt() != null
                        && jwt.getExpiresAt().isAfter(jwt.getIssuedAt())) return OAuth2TokenValidatorResult.success();
            } catch (IllegalArgumentException ignored) { }
            return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Invalid token claims", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(issuer), claims));
        return decoder;
    }
}
