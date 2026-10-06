package com.project.messenger.identity.dto.user;

import jakarta.validation.constraints.NotBlank;

public record DeleteUserRequest(@NotBlank String password) {
}
