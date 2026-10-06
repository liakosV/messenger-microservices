package com.project.messenger.chat.security;
import com.project.messenger.chat.core.ChatException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

public class ActiveUserFilter extends OncePerRequestFilter {
    private final ActiveUserVerifier verifier;
    public ActiveUserFilter(ActiveUserVerifier verifier) { this.verifier = verifier; }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if ((path.equals("/api/conversations") || path.startsWith("/api/conversations/"))
                && SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken auth) {
            try { verifier.verify(auth.getToken()); }
            catch (ChatException exception) {
                response.setStatus(exception.getStatus().value());
                response.setContentType("application/problem+json");
                response.getWriter().write("{\"status\":" + exception.getStatus().value()
                        + ",\"detail\":\"Account verification failed or identity service unavailable\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
