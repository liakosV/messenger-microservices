package com.project.messenger.chat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import com.project.messenger.chat.config.JwtConfig;
import org.springframework.core.io.ByteArrayResource;
import java.security.KeyPairGenerator;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@SpringBootTest
@ActiveProfiles("test")
class ChatServiceApplicationTests {

	@TestBean(methodName = "testJwtDecoder")
	private JwtDecoder jwtDecoder;

	static JwtDecoder testJwtDecoder() throws Exception {
		var generator = KeyPairGenerator.getInstance("RSA");
		generator.initialize(2048);
		var publicKey = generator.generateKeyPair().getPublic();
		String pem = "-----BEGIN PUBLIC KEY-----\n"
				+ Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(publicKey.getEncoded())
				+ "\n-----END PUBLIC KEY-----\n";
		return new JwtConfig().jwtDecoder(new ByteArrayResource(pem.getBytes(StandardCharsets.US_ASCII)),
				"https://identity.example.test");
	}

	@Test
	void contextLoads() {
	}

}
