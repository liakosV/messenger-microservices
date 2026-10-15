package com.project.messenger.chat.repository;
import com.project.messenger.chat.model.Message;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface MessageRepository extends JpaRepository<Message, Long> {

    Optional<Message> findByUuidAndConversationId(java.util.UUID uuid, Long conversationId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from Message m join m.conversation.participants p where p = :caller and m.senderUuid <> :caller and :user not member of m.readBy order by m.id")
    java.util.List<Message> findUnread(java.util.UUID caller, String user);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from Message m where m.uuid = :uuid and m.conversation.id = :conversationId")
    Optional<Message> findForReceipt(java.util.UUID uuid, Long conversationId);

    Page<Message> findByConversationId(Long conversationId, Pageable pageable);
}
