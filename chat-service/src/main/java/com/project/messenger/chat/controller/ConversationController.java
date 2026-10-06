package com.project.messenger.chat.controller;
import com.project.messenger.chat.dto.*;
import com.project.messenger.chat.service.ConversationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequestMapping("/api/conversations") @RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ConversationController {
    private final ConversationService service;
    @PostMapping
    public ResponseEntity<ConversationReadDTO> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ConversationInsertDTO request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.create(request, UUID.fromString(jwt.getSubject()), jwt.getTokenValue()));
    }
    @GetMapping
    public PageDTO<ConversationReadDTO> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(UUID.fromString(jwt.getSubject()), page, size);
    }
    @GetMapping("/{uuid}")
    public ConversationReadDTO get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID uuid) { return service.get(uuid, UUID.fromString(jwt.getSubject())); }
    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID uuid) {
        service.delete(uuid, UUID.fromString(jwt.getSubject())); return ResponseEntity.noContent().build();
    }
    @PostMapping("/{uuid}/leave")
    public ResponseEntity<Void> leave(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID uuid) {
        service.leave(uuid, UUID.fromString(jwt.getSubject())); return ResponseEntity.noContent().build();
    }
}
