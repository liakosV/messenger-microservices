package com.project.messenger.identity.dto.user;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public record UserIdResolutionRequest(@NotEmpty @Size(max = 100) Set<@NotNull UUID> userUuids) {}
