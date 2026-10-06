package com.project.messenger.chat.dto;
import jakarta.validation.constraints.*;
public record MessageWriteDTO(@NotBlank @Size(max = 2000) String content) { }
