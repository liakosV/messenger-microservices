package com.project.messenger.identity.dto.user;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UsernameResolutionRequest(
        @NotEmpty @Size(max = 99) List<@NotBlank @Pattern(regexp = "^[a-zA-Z0-9._-]{3,30}$") String> usernames) {}
