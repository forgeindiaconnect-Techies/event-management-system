package com.fic.event_management_system.config;

import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FixPlaintextPasswordsRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public FixPlaintextPasswordsRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        List<User> users = userRepository.findAll();
        int fixedCount = 0;
        
        for (User user : users) {
            String pwd = user.getPassword();
            // Secure BCrypt hashes always start with $2a$, $2b$, or $2y$. 
            // If it doesn't, it's a plain text password that needs to be encrypted!
            if (pwd != null && !pwd.startsWith("$2a$") && !pwd.startsWith("$2b$") && !pwd.startsWith("$2y$")) {
                user.setPassword(passwordEncoder.encode(pwd));
                userRepository.save(user);
                fixedCount++;
            }
        }
        
        if (fixedCount > 0) {
            System.out.println("==========================================================");
            System.out.println("✅ SUCCESSFULLY FIXED " + fixedCount + " OLD ACCOUNTS WITH PLAIN-TEXT PASSWORDS!");
            System.out.println("==========================================================");
        }
    }
}
