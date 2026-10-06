package com.project.messenger.identity.mapper;

import com.project.messenger.identity.dto.user.UserInsertDTO;
import com.project.messenger.identity.dto.user.UserReadDTO;
import com.project.messenger.identity.dto.user.UserUpdateDTO;
import com.project.messenger.identity.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public void updateUserEntity(UserUpdateDTO dto, User user) {
        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getDateOfBirth() != null) user.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
        // Password changes are handled by the service, never copied as raw values.
    }

    public User mapToUserEntity(UserInsertDTO dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setPhoneNumber(dto.getPhoneNumber());
        return user;
    }

    public UserReadDTO mapToUserReadDTO(User user) {
        UserReadDTO dto = new UserReadDTO();
        dto.setUuid(user.getUuid());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
