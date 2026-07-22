package com.fic.event_management_system.config;

import com.fic.event_management_system.security.CustomUserDetailsService;
import com.fic.event_management_system.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            CustomUserDetailsService customUserDetailsService,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();

        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()

                        // Public APIs
                        .requestMatchers("/api/events/public/**").permitAll()
                        .requestMatchers("/api/registrations/public/**").permitAll()
                        .requestMatchers("/api/tickets/search/**").permitAll()

                        // Protected APIs - token required
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/email/deliveries/*/retry"
                        ).hasAuthority("SUPER_ADMIN")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/email/deliveries/**"
                        ).hasAuthority("SUPER_ADMIN")
                        .requestMatchers("/api/email/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/support-requests/**").hasAuthority("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/support-requests").hasAuthority("SUPER_ADMIN")
                        .requestMatchers("/api/support-requests/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/invitations/manual").hasAuthority("PORTAL_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/role-invitations/accept/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/role-invitations/reject/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/role-invitations/event/**").hasAnyAuthority("PORTAL_ADMIN", "ORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/role-invitations/organizer/**").hasAnyAuthority("PORTAL_ADMIN", "ORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/role-invitations").hasAuthority("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/role-invitations/invite").hasAnyAuthority("PORTAL_ADMIN", "ORGANIZER")
                        .requestMatchers(HttpMethod.POST, "/api/role-invitations/manual").hasAnyAuthority("PORTAL_ADMIN", "ORGANIZER")
                        .requestMatchers(HttpMethod.POST, "/api/events/*/operations/incidents").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/*/operations/incidents/mine").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/*/operations/incidents").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/events/*/operations/incidents/*").authenticated()
                        .requestMatchers("/api/events/*/operations/**").hasAnyAuthority("PORTAL_ADMIN", "ORGANIZER")
                        .requestMatchers(HttpMethod.POST, "/api/events").hasAnyAuthority("PORTAL_ADMIN", "ORGANIZER")
                        .requestMatchers(HttpMethod.PUT, "/api/events/**").hasAnyAuthority("PORTAL_ADMIN", "ORGANIZER")
                        .requestMatchers("/api/users/**").authenticated()
                        .requestMatchers("/api/reports/**").authenticated()
                        .requestMatchers("/api/portal/**").authenticated()
                        .requestMatchers("/api/event-assignments/**").authenticated()
                        .requestMatchers("/api/super-admin/**").hasAuthority("SUPER_ADMIN")
                        .requestMatchers("/api/subscriptions/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/portals").hasAuthority("SUPER_ADMIN")
                        .requestMatchers("/api/portals/**").authenticated()

                        // Keep other APIs open for now
                        .anyRequest().permitAll()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
