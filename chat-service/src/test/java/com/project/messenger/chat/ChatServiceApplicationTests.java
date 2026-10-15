package com.project.messenger.chat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import com.project.messenger.chat.config.JwtConfig;
import org.springframework.core.io.ByteArrayResource;
import java.security.KeyPairGenerator;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@SpringBootTest
@ActiveProfiles("test")
class ChatServiceApplicationTests {

	@TestBean(methodName = "testJwtDecoder")
	private JwtDecoder jwtDecoder;

	static JwtDecoder testJwtDecoder() throws Exception {
		var generator = KeyPairGenerator.getInstance("RSA");
		generator.initialize(2048);
		var publicKey = generator.generateKeyPair().getPublic();
		String pem = "-----BEGIN PUBLIC KEY-----\n"
				+ Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(publicKey.getEncoded())
				+ "\n-----END PUBLIC KEY-----\n";
		return new JwtConfig().jwtDecoder(new ByteArrayResource(pem.getBytes(StandardCharsets.US_ASCII)),
				"https://identity.example.test");
	}

    @org.springframework.beans.factory.annotation.Autowired
    private com.project.messenger.chat.repository.ConversationRepository conversations;
    @org.springframework.beans.factory.annotation.Autowired
    private com.project.messenger.chat.repository.MessageRepository messages;
    @org.springframework.beans.factory.annotation.Autowired
    private com.project.messenger.chat.service.MessageService messageService;
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.transaction.support.TransactionTemplate transactions;

    @Test
    void offlineMessagesRemainUnreadAcrossSessionsUntilAcknowledged() {
        var sender = java.util.UUID.randomUUID();
        var recipient = java.util.UUID.randomUUID();
        var ids = transactions.execute(status -> {
            var conversation = new com.project.messenger.chat.model.Conversation();
            conversation.setCreatorUuid(sender);
            conversation.setParticipants(new java.util.HashSet<>(java.util.Set.of(sender, recipient)));
            conversations.saveAndFlush(conversation);
            var message = new com.project.messenger.chat.model.Message();
            message.setConversation(conversation); message.setSenderUuid(sender); message.setContent("sent while offline");
            messages.saveAndFlush(message);
            return java.util.List.of(conversation.getUuid(), message.getUuid());
        });
        org.junit.jupiter.api.Assertions.assertEquals(java.util.Map.of(ids.get(0), 1L), messageService.syncInbox(recipient));
        org.junit.jupiter.api.Assertions.assertEquals(java.util.Map.of(ids.get(0), 1L), messageService.syncInbox(recipient));
        org.junit.jupiter.api.Assertions.assertTrue(messageService.syncInbox(sender).isEmpty());
        var delivered = messageService.list(ids.get(0), sender, 0, 50).content().getFirst();
        org.junit.jupiter.api.Assertions.assertEquals(java.util.Set.of(recipient.toString()), delivered.deliveredTo());
        org.junit.jupiter.api.Assertions.assertTrue(delivered.readBy().isEmpty());
        messageService.acknowledge(ids.get(0), recipient, java.util.List.of(ids.get(1)));
        org.junit.jupiter.api.Assertions.assertTrue(messageService.syncInbox(recipient).isEmpty());
        var read = messageService.list(ids.get(0), sender, 0, 50).content().getFirst();
        org.junit.jupiter.api.Assertions.assertEquals(java.util.Set.of(recipient.toString()), read.readBy());
        org.junit.jupiter.api.Assertions.assertNull(read.editedAt());
    }

	@Test
	void contextLoads() {
	}

}
