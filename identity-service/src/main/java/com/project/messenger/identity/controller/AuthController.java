package com.project.messenger.identity.controller;

import com.project.messenger.identity.dto.authentication.AuthResponseDTO;
import com.project.messenger.identity.dto.authentication.LoginRequestDTO;
import com.project.messenger.identity.dto.user.UserInsertDTO;
import com.project.messenger.identity.dto.user.UserReadDTO;
import com.project.messenger.identity.service.AuthService;
import com.project.messenger.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserReadDTO> registerUser(@Valid @RequestBody UserInsertDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(userService.createUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(authService.authenticate(request));
    }
}
