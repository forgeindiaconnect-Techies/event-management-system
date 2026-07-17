package com.fic.event_management_system.security;

import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        boolean enabled = Boolean.TRUE.equals(user.getActive())
                && (user.getPortal() == null
                    || (!Boolean.TRUE.equals(user.getPortal().getDeleted())
                        && Boolean.TRUE.equals(user.getPortal().getActive())));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority(user.getRole().getRoleName().name())))
                .disabled(!enabled)
                .build();
    }
}
