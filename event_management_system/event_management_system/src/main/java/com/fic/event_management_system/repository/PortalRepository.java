package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.Portal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PortalRepository extends JpaRepository<Portal, Long> {

    Optional<Portal> findByPortalCode(String portalCode);

    boolean existsByPortalCode(String portalCode);

    List<Portal> findByAdminId(Long adminId);

    List<Portal> findByDeletedFalseOrDeletedIsNull();

    @Query("""
        select case when count(portal) > 0 then true else false end
          from Portal portal
         where lower(portal.portalName) = lower(:portalName)
           and (portal.deleted = false or portal.deleted is null)
    """)
    boolean existsActivePortalName(@Param("portalName") String portalName);
}
