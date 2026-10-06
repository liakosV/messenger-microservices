package com.project.messenger.chat.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

@Entity @Table(name = "messages") @Getter @Setter
public class Message extends ChatEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "sender_uuid", nullable = false, length = 36)
    private UUID senderUuid;
    @Column(nullable = false, length = 2000)
    private String content;
}
