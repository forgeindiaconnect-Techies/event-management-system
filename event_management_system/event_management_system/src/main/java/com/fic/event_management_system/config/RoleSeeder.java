package com.fic.event_management_system.config;

import com.fic.event_management_system.entity.Role;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RoleSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public RoleSeeder(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {

        for (RoleName roleName : RoleName.values()) {

            if (roleRepository.findByRoleName(roleName).isEmpty()) {

                Role role = new Role();
                role.setRoleName(roleName);

                roleRepository.save(role);
            }
        }
    }
}
