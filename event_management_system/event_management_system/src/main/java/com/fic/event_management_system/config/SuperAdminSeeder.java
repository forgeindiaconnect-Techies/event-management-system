package com.fic.event_management_system.config;

import com.fic.event_management_system.entity.Role;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.enums.RoleName;
import com.fic.event_management_system.repository.RoleRepository;
import com.fic.event_management_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SuperAdminSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${super-admin.email:superadmin@backrooms.com}")
    private String superAdminEmail;

    @Value("${super-admin.password:superadmin123}")
    private String superAdminPassword;

    @Value("${super-admin.first-name:Naveen}")
    private String superAdminFirstName;

    @Value("${super-admin.last-name:M}")
    private String superAdminLastName;

    @Value("${super-admin.phone:}")
    private String superAdminPhone;

    public SuperAdminSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        Role superAdminRole = roleRepository.findByRoleName(RoleName.SUPER_ADMIN)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName(RoleName.SUPER_ADMIN);
                    return roleRepository.save(role);
                });

        userRepository.findByEmail(superAdminEmail).ifPresentOrElse(
                existingUser -> {
                    existingUser.setFirstName(superAdminFirstName);
                    existingUser.setLastName(superAdminLastName);
                    existingUser.setPassword(passwordEncoder.encode(superAdminPassword));
                    existingUser.setPhoneNumber(superAdminPhone);
                    existingUser.setRole(superAdminRole);
                    existingUser.setPortal(null);
                    existingUser.setActive(true);
                    userRepository.save(existingUser);
                },
                () -> {
                    User user = new User();
                    user.setFirstName(superAdminFirstName);
                    user.setLastName(superAdminLastName);
                    user.setEmail(superAdminEmail);
                    user.setPassword(passwordEncoder.encode(superAdminPassword));
                    user.setPhoneNumber(superAdminPhone);
                    user.setRole(superAdminRole);
                    user.setPortal(null);
                    user.setActive(true);

                    userRepository.save(user);
                }
        );
    }
}
