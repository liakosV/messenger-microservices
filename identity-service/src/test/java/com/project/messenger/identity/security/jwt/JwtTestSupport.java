package com.project.messenger.identity.security.jwt;

import com.project.messenger.identity.config.JwtProperties;
import org.springframework.core.io.ByteArrayResource;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Duration;
import java.util.Base64;

public final class JwtTestSupport {

    public static final String ISSUER = "https://identity.example.test";
    public static final KeyPair KEY_PAIR = generateKeyPair();

    private JwtTestSupport() {
    }

    public static KeyPair generateKeyPair() {
        try {
            var generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create in-memory test keys", exception);
        }
    }

    public static JwtProperties properties() {
        return new JwtProperties(pem("PRIVATE KEY", KEY_PAIR.getPrivate().getEncoded()),
                pem("PUBLIC KEY", KEY_PAIR.getPublic().getEncoded()), ISSUER, Duration.ofMinutes(15));
    }

    public static ByteArrayResource pem(String type, byte[] encoded) {
        String content = "-----BEGIN " + type + "-----\n"
                + Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(encoded)
                + "\n-----END " + type + "-----\n";
        return new ByteArrayResource(content.getBytes(StandardCharsets.US_ASCII));
    }
}
