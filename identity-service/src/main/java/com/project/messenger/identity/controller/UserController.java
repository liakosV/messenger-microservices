package com.project.messenger.identity.controller;

import com.project.messenger.identity.dto.user.DeleteUserRequest;
import com.project.messenger.identity.dto.user.UserReadDTO;
import com.project.messenger.identity.dto.user.UserUpdateDTO;
import com.project.messenger.identity.service.UserService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserReadDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(userService.getUserByUuid(UUID.fromString(jwt.getSubject())));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserReadDTO> updateCurrentUser(@AuthenticationPrincipal Jwt jwt,
                                                        @Valid @RequestBody UserUpdateDTO request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(userService.updateUser(UUID.fromString(jwt.getSubject()), request));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUser(@AuthenticationPrincipal Jwt jwt,
                                                 @Valid @RequestBody DeleteUserRequest request) {
        userService.deleteCurrentUser(UUID.fromString(jwt.getSubject()), request.password());
        return ResponseEntity.noContent().build();
    }
}
