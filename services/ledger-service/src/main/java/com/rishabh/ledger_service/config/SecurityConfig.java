package com.rishabh.ledger_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

// this annotation is the same as others like @restcontroller, it marks the class
// as "this contains @bean methods". this class's whole job is to produce
// configured objects.
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
            .authorizeHttpRequests(auth -> auth
            .requestMatchers("/accounts/**", "/transfers/**").authenticated()
            .anyRequest().permitAll()
            )
            .httpBasic(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable());
        return http.build();
    }
    // now we hash the password, which gets stored
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    // I am hardcoding a user here, so whenever I make a curl request to
    // any of the endpoints, spring will check if this user exists, it will
    // hasht the password, and check with the stored hash password, if it matches
    // the request proceeds, this is httpbasic authentication using spring security
    public InMemoryUserDetailsManager userDetailsService(PasswordEncoder encoder) {
        UserDetails user = User.builder()
                .username("rishabh")
                .password(encoder.encode("password123"))
                .roles("USER")
                .build();
        return new InMemoryUserDetailsManager(user);
    }
    
}
