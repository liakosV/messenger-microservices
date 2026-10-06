package com.project.messenger.chat.repository;
import com.project.messenger.chat.model.Conversation;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByUuid(UUID uuid);

    Optional<Conversation> findByParticipantKey(String participantKey);

    @Query("select c from Conversation c where :userUuid member of c.participants")
    Page<Conversation> findForParticipant(@Param("userUuid") UUID userUuid, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Conversation c where c.uuid = :uuid")
    Optional<Conversation> findLockedByUuid(@Param("uuid") UUID uuid);
}
