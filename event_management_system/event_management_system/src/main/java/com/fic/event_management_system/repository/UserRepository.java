package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
	
    Optional<User> findByEmail(String email);
    
    
    List<User> findByPortalIdAndRole_RoleName(Long portalId, RoleName roleName);

    List<User> findByRole_RoleName(RoleName roleName);

    long countByRole_RoleName(RoleName roleName);
    
    List<User> findByPortalId(Long portalId);

    List<User> findByPortalIdAndActiveTrue(Long portalId);

    long countByActiveTrue();
}
