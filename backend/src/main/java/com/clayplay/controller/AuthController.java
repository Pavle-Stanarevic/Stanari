package com.clayplay.controller;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.Korisnik;
import com.clayplay.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @PostMapping(path = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
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

    @PostMapping(path = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerMultipart(
            @RequestParam(value = "firstName", required = false) String firstName,
            @RequestParam(value = "lastName", required = false) String lastName,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "contact", required = false) String contact,
            @RequestParam(value = "email") String email,
            @RequestParam(value = "password") String password,
            @RequestParam(value = "confirmPassword") String confirmPassword,
            @RequestParam(value = "userType") String userType,
            @RequestParam(value = "studyName", required = false) String studyName,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            RegistrationRequest req = new RegistrationRequest();
            req.firstName = firstName;
            req.lastName = lastName;
            req.address = address;
            req.contact = contact;
            req.email = email;
            req.password = password;
            req.confirmPassword = confirmPassword;
            req.userType = userType;
            req.studyName = studyName;

            byte[] bytes = null;
            String contentType = null;
            if (image != null && !image.isEmpty()) {
                try { bytes = image.getBytes(); } catch (IOException ignored) {}
                contentType = image.getContentType();
            }

            Korisnik created = userService.register(req, bytes, contentType);
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
