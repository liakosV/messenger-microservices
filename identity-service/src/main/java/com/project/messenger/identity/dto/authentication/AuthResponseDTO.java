package com.project.messenger.identity.dto.authentication;

public record AuthResponseDTO(String accessToken, String tokenType, long expiresIn) {
}
