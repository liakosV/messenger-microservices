package com.project.messenger.chat.service;

import com.project.messenger.chat.core.ChatException;
import com.project.messenger.chat.dto.*;
import com.project.messenger.chat.mapper.ChatMapper;
import com.project.messenger.chat.model.Conversation;
import com.project.messenger.chat.repository.ConversationRepository;
import com.project.messenger.chat.security.ActiveUserVerifier;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service @RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository repository;
    private final ChatMapper mapper;
    private final ActiveUserVerifier identityVerifier;

    @Transactional
    public ConversationReadDTO create(ConversationInsertDTO request, UUID caller, String accessToken) {
        Set<UUID> participants = new HashSet<>(request.participantUuids());
        participants.add(caller);
        if (participants.size() < 2 || participants.size() > 100) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "Conversation requires 2 to 100 participants");
        }
        identityVerifier.verifyParticipants(participants, accessToken);
        String key = participantKey(participants);
        var existing = repository.findByParticipantKey(key);
        if (existing.isPresent()) return mapper.toConversationDTO(existing.get());
        Conversation conversation = new Conversation();
        conversation.setCreatorUuid(caller);
        conversation.setParticipants(participants);
        conversation.setParticipantKey(key);
        return mapper.toConversationDTO(repository.saveAndFlush(conversation));
    }

    @Transactional(readOnly = true)
    public PageDTO<ConversationReadDTO> list(UUID caller, int page, int size) {
        return PageDTO.from(repository.findForParticipant(caller, PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt", "id"))).map(mapper::toConversationDTO));
    }

    @Transactional(readOnly = true)
    public ConversationReadDTO get(UUID uuid, UUID caller) { return mapper.toConversationDTO(requireParticipant(uuid, caller, false)); }

    @Transactional
    public void leave(UUID uuid, UUID caller) {
        Conversation conversation = requireParticipant(uuid, caller, true);
        conversation.getParticipants().remove(caller);
        if (conversation.getParticipants().isEmpty()) repository.delete(conversation);
        else {
            conversation.setParticipantKey(null);
            // Collection changes do not reliably trigger auditing on the owner row.
            conversation.setUpdatedAt(java.time.LocalDateTime.now());
        }
    }

    @Transactional
    public void delete(UUID uuid, UUID caller) {
        Conversation conversation = requireParticipant(uuid, caller, true);
        if (!conversation.getCreatorUuid().equals(caller)) {
            throw new ChatException(HttpStatus.FORBIDDEN, "Only the creator can delete a conversation");
        }
        repository.delete(conversation);
    }

    public Conversation requireParticipant(UUID uuid, UUID caller, boolean lock) {
        Conversation conversation = (lock ? repository.findLockedByUuid(uuid) : repository.findByUuid(uuid))
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Conversation not found"));
        if (!conversation.getParticipants().contains(caller)) {
            throw new ChatException(HttpStatus.FORBIDDEN, "Conversation access denied");
        }
        return conversation;
    }

    private static String participantKey(Set<UUID> participants) {
        try {
            String canonical = String.join(",", participants.stream().map(UUID::toString).sorted().toList());
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }
}
