package com.project.messenger.chat.websocket;
import com.project.messenger.chat.dto.MessageReadDTO;
import java.util.Set;
import java.util.UUID;
public record ChatEvent(String type, UUID conversationUuid, UUID messageUuid, MessageReadDTO message, Set<UUID> recipients) { }
