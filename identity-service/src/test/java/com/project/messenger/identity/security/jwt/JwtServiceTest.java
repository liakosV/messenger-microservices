package com.project.messenger.identity.security.jwt;

import com.project.messenger.identity.config.JwtConfig;
import com.project.messenger.identity.config.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.*;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private final JwtConfig config = new JwtConfig();
    private final Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    private JwtEncoder encoder;
    private JwtDecoder decoder;

    @BeforeEach
    void setUp() {
        encoder = config.jwtEncoder(JwtTestSupport.KEY_PAIR);
        decoder = config.jwtDecoder(JwtTestSupport.KEY_PAIR, JwtTestSupport.properties());
    }

    @Test
    void issuedTokenHasVerifiedUuidIssuerAndLifetimeWithoutPrivateUserData() {
        var service = new JwtService(encoder, JwtTestSupport.properties(), Clock.fixed(now, ZoneOffset.UTC));
        UUID uuid = UUID.randomUUID();
        var response = service.issueToken(uuid);
        Jwt jwt = decoder.decode(response.accessToken());
        assertEquals(uuid.toString(), jwt.getSubject());
        assertEquals(JwtTestSupport.ISSUER, jwt.getIssuer().toString());
        assertEquals(now, jwt.getIssuedAt());
        assertEquals(now.plusSeconds(900), jwt.getExpiresAt());
        assertEquals("RS256", jwt.getHeaders().get("alg"));
        assertEquals("Bearer", response.tokenType());
        assertEquals(900, response.expiresIn());
        assertEquals(4, jwt.getClaims().size());
    }

    @Test
    void rejectsWrongIssuer() {
        String token = encode(claims().issuer("https://different.example.test").build(), encoder);
        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    void rejectsExpiredToken() {
        String token = encode(claims().issuedAt(now.minusSeconds(600)).expiresAt(now.minusSeconds(120)).build(), encoder);
        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    void rejectsSignatureFromAnotherKey() {
        String token = encode(claims().build(), config.jwtEncoder(JwtTestSupport.generateKeyPair()));
        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    void rejectsMissingExpiryAndInvalidSubject() {
        String noExpiry = encode(JwtClaimsSet.builder().subject(UUID.randomUUID().toString())
                .issuer(JwtTestSupport.ISSUER).issuedAt(now).build(), encoder);
        String invalidSubject = encode(claims().subject("not-a-uuid").build(), encoder);
        assertThrows(JwtException.class, () -> decoder.decode(noExpiry));
        assertThrows(JwtException.class, () -> decoder.decode(invalidSubject));
    }

    @Test
    void loadsExternalPemFormatsAndRejectsMismatchedPair() throws Exception {
        var loaded = config.jwtKeyPair(JwtTestSupport.properties());
        assertArrayEquals(JwtTestSupport.KEY_PAIR.getPublic().getEncoded(), loaded.getPublic().getEncoded());
        var properties = JwtTestSupport.properties();
        var mismatched = new JwtProperties(properties.privateKey(),
                JwtTestSupport.pem("PUBLIC KEY", JwtTestSupport.generateKeyPair().getPublic().getEncoded()),
                properties.issuer(), properties.accessTokenTtl());
        assertThrows(IllegalArgumentException.class, () -> config.jwtKeyPair(mismatched));
    }

    private JwtClaimsSet.Builder claims() {
        return JwtClaimsSet.builder().subject(UUID.randomUUID().toString())
                .issuer(JwtTestSupport.ISSUER).issuedAt(now).expiresAt(now.plusSeconds(900));
    }

    private String encode(JwtClaimsSet claims, JwtEncoder signingEncoder) {
        return signingEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
}
