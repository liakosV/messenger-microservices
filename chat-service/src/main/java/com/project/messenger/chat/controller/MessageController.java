package com.project.messenger.chat.controller;
import com.project.messenger.chat.dto.*;
import com.project.messenger.chat.service.MessageService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequestMapping("/api/conversations/{conversationUuid}/messages") @RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class MessageController {
    private final MessageService service;
    @PostMapping
    public ResponseEntity<MessageReadDTO> send(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID conversationUuid, @Valid @RequestBody MessageWriteDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.send(conversationUuid, UUID.fromString(jwt.getSubject()), request));
    }
    @GetMapping
    public PageDTO<MessageReadDTO> list(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID conversationUuid,
            @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        return service.list(conversationUuid, UUID.fromString(jwt.getSubject()), page, size);
    }
    @PatchMapping("/{messageUuid}")
    public MessageReadDTO edit(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID conversationUuid,
            @PathVariable UUID messageUuid, @Valid @RequestBody MessageWriteDTO request) {
        return service.edit(conversationUuid, messageUuid, UUID.fromString(jwt.getSubject()), request);
    }
    @DeleteMapping("/{messageUuid}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID conversationUuid, @PathVariable UUID messageUuid) {
        service.delete(conversationUuid, messageUuid, UUID.fromString(jwt.getSubject())); return ResponseEntity.noContent().build();
    }
}
