package com.project.messenger.chat.dto;
import java.time.LocalDateTime;
import java.util.UUID;
public record MessageReadDTO(UUID uuid, UUID conversationUuid, UUID senderUuid, String content,
                            LocalDateTime createdAt, LocalDateTime updatedAt, java.util.Set<String> deliveredTo, java.util.Set<String> readBy, LocalDateTime editedAt) {
    public MessageReadDTO(UUID uuid, UUID conversationUuid, UUID senderUuid, String content,
                          LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(uuid, conversationUuid, senderUuid, content, createdAt, updatedAt, java.util.Set.of(), java.util.Set.of(), null);
    }
}
