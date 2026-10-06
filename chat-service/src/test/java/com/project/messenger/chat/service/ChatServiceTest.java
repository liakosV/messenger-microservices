package com.project.messenger.chat.service;
import com.project.messenger.chat.core.ChatException;
import com.project.messenger.chat.dto.*;
import com.project.messenger.chat.mapper.ChatMapper;
import com.project.messenger.chat.model.*;
import com.project.messenger.chat.repository.*;
import com.project.messenger.chat.websocket.ChatEvent;
import org.junit.jupiter.api.*;
import org.springframework.context.ApplicationEventPublisher;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class ChatServiceTest {
    ConversationRepository conversationRepository;
    MessageRepository messageRepository;
    ApplicationEventPublisher events;
    ConversationService conversations;
    com.project.messenger.chat.security.ActiveUserVerifier identityVerifier;
    MessageService messages;
    Conversation conversation;
    UUID caller = UUID.randomUUID(), other = UUID.randomUUID(), outsider = UUID.randomUUID();
    @BeforeEach
    void setup() {
        conversationRepository = mock(ConversationRepository.class);
        messageRepository = mock(MessageRepository.class);
        events = mock(ApplicationEventPublisher.class);
        identityVerifier = mock(com.project.messenger.chat.security.ActiveUserVerifier.class);
        conversations = new ConversationService(conversationRepository, new ChatMapper(), identityVerifier);
        messages = new MessageService(messageRepository, conversations, new ChatMapper(), events);
        conversation = new Conversation();
        conversation.setId(1L); conversation.setUuid(UUID.randomUUID()); conversation.setCreatorUuid(caller);
        conversation.setParticipants(new HashSet<>(Set.of(caller, other)));
        when(conversationRepository.findByUuid(conversation.getUuid())).thenReturn(Optional.of(conversation));
        when(conversationRepository.findLockedByUuid(conversation.getUuid())).thenReturn(Optional.of(conversation));
        when(conversationRepository.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        when(messageRepository.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
    }
    @Test
    void createIncludesCallerWithoutMutatingRequest() {
        Set<UUID> input = Set.of(other);
        var result = conversations.create(new ConversationInsertDTO(input), caller, "test-token");
        assertEquals(Set.of(caller, other), result.participantUuids());
        assertEquals(caller, result.creatorUuid()); assertEquals(Set.of(other), input);
        verify(identityVerifier).verifyParticipants(Set.of(caller, other), "test-token");
    }
    @Test
    void missingParticipantOrIdentityFailureDoesNotCreateOrReturnConversation() {
        doThrow(new ChatException(org.springframework.http.HttpStatus.BAD_REQUEST, "inactive"))
                .when(identityVerifier).verifyParticipants(anySet(), anyString());
        assertThrows(ChatException.class, () -> conversations.create(new ConversationInsertDTO(Set.of(other)), caller, "test-token"));
        verifyNoInteractions(conversationRepository);
    }
    @Test
    void sameParticipantsReturnExistingConversation() {
        when(conversationRepository.findByParticipantKey(anyString())).thenReturn(Optional.of(conversation));
        assertEquals(conversation.getUuid(), conversations.create(new ConversationInsertDTO(Set.of(other)), caller, "test-token").uuid());
        verify(conversationRepository, never()).saveAndFlush(any());
    }
    @Test
    void selfOnlyConversationRejected() {
        assertThrows(ChatException.class, () -> conversations.create(new ConversationInsertDTO(Set.of(caller)), caller, "test-token"));
        verify(conversationRepository, never()).saveAndFlush(any());
    }
    @Test
    void outsiderCannotReadSendEditDeleteOrLeave() {
        assertThrows(ChatException.class, () -> conversations.get(conversation.getUuid(), outsider));
        assertThrows(ChatException.class, () -> conversations.leave(conversation.getUuid(), outsider));
        assertThrows(ChatException.class, () -> messages.list(conversation.getUuid(), outsider, 0, 20));
        assertThrows(ChatException.class, () -> messages.send(conversation.getUuid(), outsider, new MessageWriteDTO("hello")));
        assertThrows(ChatException.class, () -> messages.edit(conversation.getUuid(), UUID.randomUUID(), outsider, new MessageWriteDTO("hello")));
        assertThrows(ChatException.class, () -> messages.delete(conversation.getUuid(), UUID.randomUUID(), outsider));
        verifyNoInteractions(messageRepository, events);
    }
    @Test
    void onlyCreatorCanDeleteConversation() {
        assertThrows(ChatException.class, () -> conversations.delete(conversation.getUuid(), other));
        conversations.delete(conversation.getUuid(), caller);
        verify(conversationRepository).delete(conversation);
    }
    @Test
    void leaveRemovesMembershipAndDisablesOriginalParticipantKey() {
        conversation.setParticipantKey("original-key");
        conversations.leave(conversation.getUuid(), other);
        assertEquals(Set.of(caller), conversation.getParticipants()); assertNull(conversation.getParticipantKey());
        assertThrows(ChatException.class, () -> messages.send(conversation.getUuid(), other, new MessageWriteDTO("hello")));
    }
    @Test
    void lastParticipantLeavingDeletesConversation() {
        conversation.setParticipants(new HashSet<>(Set.of(caller)));
        conversations.leave(conversation.getUuid(), caller);
        verify(conversationRepository).delete(conversation);
    }
    @Test
    void sendSetsSenderAndPublishesOnlyForMembers() {
        var result = messages.send(conversation.getUuid(), caller, new MessageWriteDTO("hello"));
        assertEquals(caller, result.senderUuid()); assertEquals("hello", result.content());
        var event = org.mockito.ArgumentCaptor.forClass(ChatEvent.class);
        verify(events).publishEvent(event.capture()); assertEquals(Set.of(caller, other), event.getValue().recipients());
        verify(conversationRepository).findLockedByUuid(conversation.getUuid());
    }
    @Test
    void onlySenderCanEditOrDeleteMessage() {
        Message message = new Message(); message.setUuid(UUID.randomUUID()); message.setConversation(conversation);
        message.setSenderUuid(caller); message.setContent("original");
        when(messageRepository.findByUuidAndConversationId(message.getUuid(), 1L)).thenReturn(Optional.of(message));
        assertThrows(ChatException.class, () -> messages.edit(conversation.getUuid(), message.getUuid(), other, new MessageWriteDTO("bad")));
        assertThrows(ChatException.class, () -> messages.delete(conversation.getUuid(), message.getUuid(), other));
        assertEquals("original", message.getContent());
        assertEquals("edited", messages.edit(conversation.getUuid(), message.getUuid(), caller, new MessageWriteDTO("edited")).content());
        messages.delete(conversation.getUuid(), message.getUuid(), caller); verify(messageRepository).delete(message);
    }
}
