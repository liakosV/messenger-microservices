package com.project.messenger.identity.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDTO {

    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$",
            message = "Username can only contain letters, numbers, dots, underscores and hyphens")
    private String username;

    @Pattern(regexp = "(?s).*\\S.*", message = "Email must not be blank")
    @Email(message = "Invalid email")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    // Null preserves the existing password; a supplied password must not be blank.
    @Pattern(regexp = "(?s).*\\S.*", message = "New password must not be blank")
    private String password;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Pattern(regexp = "(?s).*\\S.*", message = "Phone number must not be blank")
    @Size(max = 255, message = "Phone number must not exceed 255 characters")
    private String phoneNumber;
}
