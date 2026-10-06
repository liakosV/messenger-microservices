package com.project.messenger.identity.security.jwt;

import com.project.messenger.identity.config.JwtProperties;
import com.project.messenger.identity.dto.authentication.AuthResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties properties;
    private final Clock jwtClock;

    public AuthResponseDTO issueToken(UUID userUuid) {
        Instant now = jwtClock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(userUuid.toString())
                .issuer(properties.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(properties.accessTokenTtl()))
                .build();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponseDTO(token, "Bearer", properties.accessTokenTtl().toSeconds());
    }
}
