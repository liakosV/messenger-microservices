package com.project.messenger.chat.dto;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
public record ConversationReadDTO(UUID uuid, UUID creatorUuid, Set<UUID> participantUuids,
                                  LocalDateTime createdAt, LocalDateTime updatedAt) { }
