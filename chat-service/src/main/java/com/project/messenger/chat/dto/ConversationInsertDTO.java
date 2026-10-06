package com.project.messenger.chat.dto;
import jakarta.validation.constraints.*;
import java.util.Set;
import java.util.UUID;
public record ConversationInsertDTO(@NotNull @Size(min = 1, max = 99) Set<@NotNull UUID> participantUuids) { }
