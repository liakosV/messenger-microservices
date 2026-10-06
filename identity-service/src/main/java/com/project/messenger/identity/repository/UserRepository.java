package com.project.messenger.identity.repository;

import com.project.messenger.identity.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {

    long countByUuidInAndDeletedFalse(Set<UUID> uuids);

    @Query("select u from User u where u.deleted = false and "
            + "(u.username = :identifier or u.email = :identifier or u.phoneNumber = :identifier)")
    List<User> findActiveLoginCandidates(@Param("identifier") String identifier);

    Optional<User> findByUuidAndDeletedFalse(UUID uuid);

    List<User> findAllByDeletedFalse();

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    Optional<User> findByUuid(UUID uuid);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    List<User> findAllByUuidIn(Set<UUID> uuids);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByUuid(UUID uuid);
}
