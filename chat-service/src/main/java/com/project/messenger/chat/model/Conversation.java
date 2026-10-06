package com.project.messenger.chat.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity @Table(name = "conversations") @Getter @Setter
public class Conversation extends ChatEntity {
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "creator_uuid", nullable = false, length = 36)
    private UUID creatorUuid;
    @Column(name = "participant_key", unique = true, length = 64)
    private String participantKey;
    @ElementCollection
    @CollectionTable(name = "conversation_participants", joinColumns = @JoinColumn(name = "conversation_id"))
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_uuid", nullable = false, length = 36)
    private Set<UUID> participants = new HashSet<>();
}
