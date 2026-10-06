package com.project.messenger.chat.config;
import com.project.messenger.chat.security.*;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ActiveUserVerifier verifier) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable).formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable).logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.GET, "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**", "/ws/chat").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/conversations", "/api/conversations/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/conversations", "/api/conversations/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/conversations/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/conversations/**").authenticated()
                        .anyRequest().denyAll())
                .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
                .addFilterAfter(new ActiveUserFilter(verifier), BearerTokenAuthenticationFilter.class);
        return http.build();
    }
}
