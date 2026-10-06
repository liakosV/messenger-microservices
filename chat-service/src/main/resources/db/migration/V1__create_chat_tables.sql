CREATE TABLE conversations (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL,
    creator_uuid CHAR(36) NOT NULL,
    participant_key CHAR(64) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_conversations_uuid UNIQUE (uuid),
    CONSTRAINT uk_conversations_participant_key UNIQUE (participant_key)
);

CREATE TABLE conversation_participants (
    conversation_id BIGINT NOT NULL,
    user_uuid CHAR(36) NOT NULL,
    PRIMARY KEY (conversation_id, user_uuid),
    INDEX idx_participants_user (user_uuid),
    CONSTRAINT fk_participants_conversation FOREIGN KEY (conversation_id)
        REFERENCES conversations (id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL,
    conversation_id BIGINT NOT NULL,
    sender_uuid CHAR(36) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_messages_uuid UNIQUE (uuid),
    INDEX idx_messages_conversation_created (conversation_id, created_at, id),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id)
        REFERENCES conversations (id) ON DELETE CASCADE
);
