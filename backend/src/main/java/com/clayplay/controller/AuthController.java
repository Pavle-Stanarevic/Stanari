package com.clayplay.controller;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.Korisnik;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.service.UserService;
import com.clayplay.model.Organizator;
import com.clayplay.repository.OrganizatorRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final KorisnikRepository korisnikRepository;
    private final OrganizatorRepository organizatorRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.clientId:}")
    private String googleClientId;

    public AuthController(
        UserService userService,
        KorisnikRepository korisnikRepository,
        OrganizatorRepository organizatorRepository
    ) {
        this.userService = userService;
        this.korisnikRepository = korisnikRepository;
        this.organizatorRepository = organizatorRepository;
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
            boolean isOrg = userService.isOrganizator(created.getIdKorisnik());
            userMap.put("userType", isOrg ? "organizator" : "polaznik");
            userMap.put("contact", created.getBrojTelefona());
            userMap.put("address", created.getAdresa());
            if (isOrg) {
                String orgStudyName = organizatorRepository.findById(created.getIdKorisnik())
                        .map(Organizator::getImeStudija)
                        .orElse(null);
                userMap.put("studyName", orgStudyName);
            }

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
            boolean isOrg = userService.isOrganizator(created.getIdKorisnik());
            userMap.put("userType", isOrg ? "organizator" : "polaznik");
            userMap.put("contact", created.getBrojTelefona());
            userMap.put("address", created.getAdresa());
            if (isOrg) {
                String orgStudyName = organizatorRepository.findById(created.getIdKorisnik())
                        .map(Organizator::getImeStudija)
                        .orElse(null);
                userMap.put("studyName", orgStudyName);
            }

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
                boolean isOrg = userService.isOrganizator(u.getIdKorisnik());
                userMap.put("userType", isOrg ? "organizator" : "polaznik");
                userMap.put("contact", u.getBrojTelefona());
                userMap.put("address", u.getAdresa());
                if (isOrg) {
                    String orgStudyName = organizatorRepository.findById(u.getIdKorisnik())
                            .map(Organizator::getImeStudija)
                            .orElse(null);
                    userMap.put("studyName", orgStudyName);
                }

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

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> body) {
        try {
            String idToken = body.get("idToken");
            if (idToken == null || idToken.isBlank()) {
                return ResponseEntity.badRequest().body("Missing idToken");
            }
            JsonNode tokenInfo = verifyGoogleIdToken(idToken);
            if (tokenInfo == null) {
                return ResponseEntity.badRequest().body("Invalid Google token");
            }
            String aud = tokenInfo.path("aud").asText("");
            boolean emailVerified = tokenInfo.path("email_verified").asText("false").equals("true") || tokenInfo.path("email_verified").asBoolean(false);
            String email = tokenInfo.path("email").asText("");
            if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(aud)) {
                return ResponseEntity.status(401).body("Token audience mismatch");
            }
            if (!emailVerified || email.isBlank()) {
                return ResponseEntity.status(401).body("Email not verified");
            }
            Optional<Korisnik> userOpt = korisnikRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body("User with this Google account is not registered");
            }
            Korisnik u = userOpt.get();
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", u.getIdKorisnik());
            userMap.put("email", u.getEmail());
            userMap.put("firstName", u.getIme());
            userMap.put("lastName", u.getPrezime());
            boolean isOrg = userService.isOrganizator(u.getIdKorisnik());
            userMap.put("userType", isOrg ? "organizator" : "polaznik");
            userMap.put("contact", u.getBrojTelefona());
            userMap.put("address", u.getAdresa());
            if (isOrg) {
                String orgStudyName = organizatorRepository.findById(u.getIdKorisnik())
                        .map(Organizator::getImeStudija)
                        .orElse(null);
                userMap.put("studyName", orgStudyName);
            }

            Map<String, Object> resp = new HashMap<>();
            resp.put("user", userMap);
            resp.put("token", "dev-token");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    private JsonNode verifyGoogleIdToken(String idToken) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .header("Accept", "application/json")
                    .build();
            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (res.statusCode() != 200) return null;
            return objectMapper.readTree(res.body());
        } catch (Exception e) {
            return null;
        }
    }
}
