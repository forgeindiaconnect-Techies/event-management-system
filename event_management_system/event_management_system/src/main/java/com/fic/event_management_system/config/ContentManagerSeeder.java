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
public class ContentManagerSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${content-manager.email:content@backrooms.com}")
    private String contentManagerEmail;

    @Value("${content-manager.password:content123}")
    private String contentManagerPassword;

    public ContentManagerSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        Role contentRole = roleRepository.findByRoleName(RoleName.MOVIE_CONTENT_MANAGER)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName(RoleName.MOVIE_CONTENT_MANAGER);
                    return roleRepository.save(role);
                });

        userRepository.findByEmail(contentManagerEmail).ifPresentOrElse(
                existingUser -> {
                    existingUser.setFirstName("Content");
                    existingUser.setLastName("Team");
                    existingUser.setPassword(passwordEncoder.encode(contentManagerPassword));
                    existingUser.setRole(contentRole);
                    existingUser.setPortal(null);
                    existingUser.setActive(true);
                    userRepository.save(existingUser);
                },
                () -> {
                    User user = new User();
                    user.setFirstName("Content");
                    user.setLastName("Team");
                    user.setEmail(contentManagerEmail);
                    user.setPassword(passwordEncoder.encode(contentManagerPassword));
                    user.setRole(contentRole);
                    user.setPortal(null);
                    user.setActive(true);

                    userRepository.save(user);
                }
        );
    }
}
