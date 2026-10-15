CREATE TABLE message_deliveries (
    message_id BIGINT NOT NULL,
    user_uuid VARCHAR(36) NOT NULL,
    PRIMARY KEY (message_id, user_uuid),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
CREATE TABLE message_reads (
    message_id BIGINT NOT NULL,
    user_uuid VARCHAR(36) NOT NULL,
    PRIMARY KEY (message_id, user_uuid),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

ALTER TABLE messages ADD COLUMN edited_at DATETIME(6) NULL;
UPDATE messages SET edited_at = updated_at WHERE updated_at <> created_at;
