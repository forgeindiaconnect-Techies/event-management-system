package com.fic.event_management_system.security;

import com.fic.event_management_system.entity.TheaterUser;
import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.TheaterUserRepository;
import com.fic.event_management_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Autowired
    private TheaterUserRepository theaterUserRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        // 1. Check event portal 'users' table
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            boolean enabled = Boolean.TRUE.equals(user.getActive())
                    && (user.getPortal() == null
                        || (!Boolean.TRUE.equals(user.getPortal().getDeleted())
                            && Boolean.TRUE.equals(user.getPortal().getActive())));

            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword() != null ? user.getPassword() : "")
                    .authorities(List.of(new SimpleGrantedAuthority(user.getRole().getRoleName().name())))
                    .disabled(!enabled)
                    .build();
        }

        // 2. Check dedicated 'theater_users' table (by email or username)
        if (theaterUserRepository != null) {
            Optional<TheaterUser> tUserOpt = theaterUserRepository.findByEmailOrUsername(email, email);
            if (tUserOpt.isPresent()) {
                TheaterUser tUser = tUserOpt.get();
                boolean enabled = Boolean.TRUE.equals(tUser.getActive());

                return org.springframework.security.core.userdetails.User
                        .withUsername(tUser.getEmail())
                        .password(tUser.getPassword() != null ? tUser.getPassword() : "")
                        .authorities(List.of(new SimpleGrantedAuthority(tUser.getRole() != null ? tUser.getRole() : "THEATER_OWNER")))
                        .disabled(!enabled)
                        .build();
            }
        }

        throw new UsernameNotFoundException("User not found: " + email);
    }
}
