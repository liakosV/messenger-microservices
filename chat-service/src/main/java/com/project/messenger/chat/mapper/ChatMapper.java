package com.project.messenger.chat.mapper;
import com.project.messenger.chat.dto.*;
import com.project.messenger.chat.model.*;
import org.springframework.stereotype.Component;
import java.util.Set;
@Component
public class ChatMapper {
    public ConversationReadDTO toConversationDTO(Conversation conversation) {
        return new ConversationReadDTO(conversation.getUuid(), conversation.getCreatorUuid(),
                Set.copyOf(conversation.getParticipants()), conversation.getCreatedAt(), conversation.getUpdatedAt());
    }
    public MessageReadDTO toMessageDTO(Message message) {
        return new MessageReadDTO(message.getUuid(), message.getConversation().getUuid(), message.getSenderUuid(),
                message.getContent(), message.getCreatedAt(), message.getUpdatedAt());
    }
}
