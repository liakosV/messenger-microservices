package com.project.messenger.identity.controller;

import com.project.messenger.identity.dto.user.ParticipantValidationRequest;
import com.project.messenger.identity.dto.user.ParticipantValidationResponse;
import com.project.messenger.identity.service.UserService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@Hidden
@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/users")
public class ParticipantValidationController {
    private final UserService userService;

    @PostMapping("/validate-participants")
    public ResponseEntity<ParticipantValidationResponse> validate(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ParticipantValidationRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(userService.validateParticipants(UUID.fromString(jwt.getSubject()), request.userUuids()));
    }
}
