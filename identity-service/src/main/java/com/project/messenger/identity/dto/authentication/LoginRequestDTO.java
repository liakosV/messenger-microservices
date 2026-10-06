package com.project.messenger.identity.dto.authentication;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequestDTO(
        @NotBlank @Size(max = 255) String identifier,
        @NotBlank String password) {
}
