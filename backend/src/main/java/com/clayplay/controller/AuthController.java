package com.clayplay.controller;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.Korisnik;
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
            Korisnik created = userService.register(req);
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", created.getIdKorisnik());
            userMap.put("email", created.getEmail());
            userMap.put("firstName", created.getIme());
            userMap.put("lastName", created.getPrezime());
            userMap.put("userType", userService.isOrganizator(created.getIdKorisnik()) ? "organizator" : "polaznik");

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
            Optional<Korisnik> userOpt = userService.authenticate(email, password);
            if (userOpt.isPresent()) {
                Korisnik u = userOpt.get();
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", u.getIdKorisnik());
                userMap.put("email", u.getEmail());
                userMap.put("firstName", u.getIme());
                userMap.put("lastName", u.getPrezime());
                userMap.put("userType", userService.isOrganizator(u.getIdKorisnik()) ? "organizator" : "polaznik");

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
