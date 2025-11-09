package com.clayplay.controller;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.User;
import com.clayplay.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegistrationRequest req) {
        try {
            User created = userService.register(req);
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", created.getId());
            userMap.put("email", created.getEmail());
            userMap.put("firstName", created.getFirstName());
            userMap.put("lastName", created.getLastName());
            userMap.put("userType", created.getUserType());

            Map<String, Object> resp = new HashMap<>();
            resp.put("user", userMap);
            resp.put("token", "dev-token");
            return ResponseEntity.ok().body(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) Map<String, String> body) {
        try {
            if (body == null) return ResponseEntity.badRequest().body("Missing credentials");
            String email = body.get("email");
            String password = body.get("password");
            Optional<User> userOpt = userService.authenticate(email, password);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", u.getId());
                userMap.put("email", u.getEmail());
                userMap.put("firstName", u.getFirstName());
                userMap.put("lastName", u.getLastName());
                userMap.put("userType", u.getUserType());

                Map<String, Object> resp = new HashMap<>();
                resp.put("user", userMap);
                resp.put("token", "dev-token");
                return ResponseEntity.ok(resp);
            } else {
                return ResponseEntity.badRequest().body("Invalid credentials");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }
}
