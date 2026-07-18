package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.RoleInvitation;
import com.fic.event_management_system.enums.InvitationStatus;
import com.fic.event_management_system.enums.RoleName;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleInvitationRepository extends JpaRepository<RoleInvitation, Long> {

    Optional<RoleInvitation> findByToken(String token);

    boolean existsByEmailAndEventIdAndRoleNameAndStatusIn(
            String email,
            Long eventId,
            RoleName roleName,
            Collection<InvitationStatus> statuses
    );

    boolean existsByEmailAndPortalIdAndRoleNameAndStatusIn(
            String email,
            Long portalId,
            RoleName roleName,
            Collection<InvitationStatus> statuses
    );

    List<RoleInvitation> findByInvitedByIdOrderByIdDesc(Long invitedById);

    List<RoleInvitation> findByEventIdAndRoleNameOrderByIdDesc(Long eventId, RoleName roleName);

    Optional<RoleInvitation> findFirstByEmailAndPortalIdAndRoleNameAndStatusOrderByIdDesc(
            String email,
            Long portalId,
            RoleName roleName,
            InvitationStatus status
    );

    long countByPortalIdAndRoleNameAndStatusIn(
            Long portalId,
            RoleName roleName,
            Collection<InvitationStatus> statuses
    );

    long countByEventIdAndRoleNameAndStatusIn(
            Long eventId,
            RoleName roleName,
            Collection<InvitationStatus> statuses
    );
}
