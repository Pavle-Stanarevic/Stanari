package com.clayplay.service;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.User;
import com.clayplay.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegistrationRequest req) {
        if (req == null) throw new IllegalArgumentException("Invalid registration data");
        if (req.password == null || !req.password.equals(req.confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        Optional<User> exists = userRepository.findByEmail(req.email);
        if (exists.isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        User u = new User();
        u.setFirstName(req.firstName);
        u.setLastName(req.lastName);
        u.setAddress(req.address);
        u.setContact(req.contact);
        u.setEmail(req.email);
        u.setUserType(req.userType);
        u.setStudyName(req.studyName);
        u.setPassword(passwordEncoder.encode(req.password));

        return userRepository.save(u);
    }

    public java.util.Optional<User> authenticate(String email, String password) {
        if (email == null || password == null) return java.util.Optional.empty();
        java.util.Optional<User> u = userRepository.findByEmail(email);
        if (u.isPresent() && passwordEncoder.matches(password, u.get().getPassword())) {
            return u;
        }
        return java.util.Optional.empty();
    }
}
