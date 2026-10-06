package com.project.messenger.chat.repository;
import com.project.messenger.chat.model.Message;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface MessageRepository extends JpaRepository<Message, Long> {

    Optional<Message> findByUuidAndConversationId(java.util.UUID uuid, Long conversationId);

    Page<Message> findByConversationId(Long conversationId, Pageable pageable);
}
