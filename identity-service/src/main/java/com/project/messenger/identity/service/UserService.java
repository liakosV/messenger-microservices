package com.project.messenger.identity.service;

import com.project.messenger.identity.core.exception.AppObjectAlreadyExistsException;
import com.project.messenger.identity.core.exception.AppObjectNotFoundException;
import com.project.messenger.identity.core.exception.AppObjectUnauthorizedException;
import com.project.messenger.identity.dto.user.UserInsertDTO;
import com.project.messenger.identity.dto.user.UserReadDTO;
import com.project.messenger.identity.dto.user.UserUpdateDTO;
import com.project.messenger.identity.dto.user.UsernameReadDTO;
import com.project.messenger.identity.dto.user.ParticipantValidationResponse;
import com.project.messenger.identity.mapper.UserMapper;
import com.project.messenger.identity.model.User;
import com.project.messenger.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsernameReadDTO> resolveUsernames(UUID caller, List<String> usernames) {
        findActiveUser(caller);
        // Use the same database equality/collation as registration uniqueness and login.
        return usernames.stream().distinct().map(username -> {
            User user = userRepository.findByUsernameAndDeletedFalse(username)
                    .orElseThrow(() -> new AppObjectNotFoundException("User", "User not found"));
            return new UsernameReadDTO(user.getUuid(), user.getUsername());
        }).distinct().toList();
    }

    @Transactional(readOnly = true)
    public ParticipantValidationResponse validateParticipants(UUID caller, Set<UUID> userUuids) {
        findActiveUser(caller);
        return new ParticipantValidationResponse(userRepository.countByUuidInAndDeletedFalse(userUuids) == userUuids.size());
    }

    @Transactional
    public UserReadDTO createUser(UserInsertDTO insertDTO) {
        // These checks provide clear errors; database constraints also protect concurrent inserts.
        if (userRepository.existsByUsername(insertDTO.getUsername())) {
            throw new AppObjectAlreadyExistsException("User", "Username already exists");
        }
        if (userRepository.existsByEmail(insertDTO.getEmail())) {
            throw new AppObjectAlreadyExistsException("User", "Email already exists");
        }
        if (userRepository.existsByPhoneNumber(insertDTO.getPhoneNumber())) {
            throw new AppObjectAlreadyExistsException("User", "Phone number already exists");
        }

        User user = userMapper.mapToUserEntity(insertDTO);
        user.setPassword(passwordEncoder.encode(insertDTO.getPassword()));
        User savedUser = userRepository.save(user);
        return userMapper.mapToUserReadDTO(savedUser);
    }

    @Transactional(readOnly = true)
    public UserReadDTO getUserByUuid(UUID uuid) {
        return userMapper.mapToUserReadDTO(findActiveUser(uuid));
    }

    @Transactional(readOnly = true)
    public List<UserReadDTO> getAllUsers() {
        return userRepository.findAllByDeletedFalse().stream()
                .map(userMapper::mapToUserReadDTO)
                .toList();
    }

    /** The calling API must authorize updates for the authenticated user before invoking this method. */
    @Transactional
    public UserReadDTO updateUser(UUID uuid, UserUpdateDTO updateDTO) {
        User user = findActiveUser(uuid);
        // Deleted accounts still reserve their unique identifiers under the existing schema.
        if (updateDTO.getUsername() != null && userRepository.existsByUsernameAndIdNot(updateDTO.getUsername(), user.getId())) {
            throw new AppObjectAlreadyExistsException("User", "Username already exists");
        }
        if (updateDTO.getEmail() != null && userRepository.existsByEmailAndIdNot(updateDTO.getEmail(), user.getId())) {
            throw new AppObjectAlreadyExistsException("User", "Email already exists");
        }
        if (updateDTO.getPhoneNumber() != null && userRepository.existsByPhoneNumberAndIdNot(updateDTO.getPhoneNumber(), user.getId())) {
            throw new AppObjectAlreadyExistsException("User", "Phone number already exists");
        }

        userMapper.updateUserEntity(updateDTO, user);
        String newPassword = updateDTO.getPassword();
        if (newPassword != null && !passwordEncoder.matches(newPassword, user.getPassword())) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        // Flush triggers update auditing before the response timestamps are mapped.
        User savedUser = userRepository.saveAndFlush(user);
        return userMapper.mapToUserReadDTO(savedUser);
    }

    /** The calling API must ensure the UUID belongs to the authenticated user. */
    @Transactional
    public void deleteCurrentUser(UUID userUuid, String rawPassword) {
        User user = findActiveUser(userUuid);
        if (rawPassword == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new AppObjectUnauthorizedException("User", "The password is incorrect");
        }
        user.setDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
    }

    private User findActiveUser(UUID uuid) {
        return userRepository.findByUuidAndDeletedFalse(uuid)
                .orElseThrow(() -> new AppObjectNotFoundException("User", "User not found"));
    }
}
