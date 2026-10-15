package com.project.messenger.chat.controller;
import com.project.messenger.chat.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.*;
@RestController @RequiredArgsConstructor
public class InboxController {
    private final MessageService service;
    @PostMapping("/api/inbox/sync")
    public Map<UUID, Long> sync(@AuthenticationPrincipal Jwt jwt) {
        return service.syncInbox(UUID.fromString(jwt.getSubject()));
    }
}
