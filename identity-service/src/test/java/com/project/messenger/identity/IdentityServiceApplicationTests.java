package com.project.messenger.identity;

import com.project.messenger.identity.config.JwtProperties;
import com.project.messenger.identity.security.jwt.JwtTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class IdentityServiceApplicationTests {

	@TestBean(methodName = "testJwtProperties")
	private JwtProperties jwtProperties;

	static JwtProperties testJwtProperties() {
		return JwtTestSupport.properties();
	}

	@Test
	void contextLoads() {
	}

}
