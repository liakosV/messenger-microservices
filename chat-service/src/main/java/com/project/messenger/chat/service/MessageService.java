package com.project.messenger.chat.service;
import com.project.messenger.chat.core.ChatException;
import com.project.messenger.chat.dto.*;
import com.project.messenger.chat.mapper.ChatMapper;
import com.project.messenger.chat.model.Message;
import com.project.messenger.chat.repository.MessageRepository;
import com.project.messenger.chat.websocket.ChatEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class MessageService {
    private final MessageRepository repository;
    private final ConversationService conversations;
    private final ChatMapper mapper;
    private final ApplicationEventPublisher events;

    @Transactional
    public MessageReadDTO send(UUID conversationUuid, UUID caller, MessageWriteDTO request) {
        var conversation = conversations.requireParticipant(conversationUuid, caller, true);
        Message message = new Message();
        message.setConversation(conversation);
        message.setSenderUuid(caller);
        message.setContent(request.content());
        var result = mapper.toMessageDTO(repository.saveAndFlush(message));
        events.publishEvent(new ChatEvent("MESSAGE_CREATED", conversationUuid, result.uuid(), result, Set.copyOf(conversation.getParticipants())));
        return result;
    }

    @Transactional(readOnly = true)
    public PageDTO<MessageReadDTO> list(UUID conversationUuid, UUID caller, int page, int size) {
        var conversation = conversations.requireParticipant(conversationUuid, caller, false);
        return PageDTO.from(repository.findByConversationId(conversation.getId(), PageRequest.of(page, size,
                Sort.by("createdAt", "id"))).map(mapper::toMessageDTO));
    }

    @Transactional
    public MessageReadDTO edit(UUID conversationUuid, UUID messageUuid, UUID caller, MessageWriteDTO request) {
        var conversation = conversations.requireParticipant(conversationUuid, caller, true);
        Message message = requireSender(messageUuid, conversation.getId(), caller);
        message.setContent(request.content());
        message.setEditedAt(java.time.LocalDateTime.now());
        var result = mapper.toMessageDTO(repository.saveAndFlush(message));
        events.publishEvent(new ChatEvent("MESSAGE_UPDATED", conversationUuid, result.uuid(), result, Set.copyOf(conversation.getParticipants())));
        return result;
    }

    @Transactional
    public void delete(UUID conversationUuid, UUID messageUuid, UUID caller) {
        var conversation = conversations.requireParticipant(conversationUuid, caller, true);
        repository.delete(requireSender(messageUuid, conversation.getId(), caller));
        events.publishEvent(new ChatEvent("MESSAGE_DELETED", conversationUuid, messageUuid, null, Set.copyOf(conversation.getParticipants())));
    }

    @Transactional
    public java.util.Map<UUID, Long> syncInbox(UUID caller) {
        var counts = new java.util.HashMap<UUID, Long>();
        for (var candidate : repository.findUnread(caller, caller.toString())) {
            var message = repository.findForReceipt(candidate.getUuid(), candidate.getConversation().getId()).orElse(null);
            if (message == null || message.getReadBy().contains(caller.toString())) continue;
            counts.merge(message.getConversation().getUuid(), 1L, Long::sum);
            if (message.getDeliveredTo().add(caller.toString())) publishReceipt(message);
        }
        return counts;
    }

    @Transactional
    public void acknowledge(UUID conversationUuid, UUID caller, java.util.List<UUID> ids) {
        var conversation = conversations.requireParticipant(conversationUuid, caller, false);
        for (UUID id : ids) {
            var message = repository.findForReceipt(id, conversation.getId())
                    .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Message not found"));
            if (message.getSenderUuid().equals(caller)) continue;
            boolean changed = message.getDeliveredTo().add(caller.toString());
            changed |= message.getReadBy().add(caller.toString());
            if (changed) publishReceipt(message);
        }
    }

    private void publishReceipt(Message message) {
        events.publishEvent(new ChatEvent("MESSAGE_RECEIPT", message.getConversation().getUuid(), message.getUuid(),
                mapper.toMessageDTO(message), Set.copyOf(message.getConversation().getParticipants())));
    }

    private Message requireSender(UUID uuid, Long conversationId, UUID caller) {
        Message message = repository.findByUuidAndConversationId(uuid, conversationId)
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Message not found"));
        if (!message.getSenderUuid().equals(caller)) throw new ChatException(HttpStatus.FORBIDDEN, "Only the sender can change a message");
        return message;
    }
}
