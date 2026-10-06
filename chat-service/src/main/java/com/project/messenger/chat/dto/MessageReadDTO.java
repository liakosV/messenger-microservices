package com.project.messenger.chat.dto;
import java.time.LocalDateTime;
import java.util.UUID;
public record MessageReadDTO(UUID uuid, UUID conversationUuid, UUID senderUuid, String content,
                            LocalDateTime createdAt, LocalDateTime updatedAt) { }
