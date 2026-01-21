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
            Map<String, Object> userMap = buildUserMap(created);

            Map<String, Object> resp = new HashMap<>();
            resp.put("user", userMap);
            resp.put("token", "dev-token");
            return ResponseEntity.ok().body(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
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
            Map<String, Object> userMap = buildUserMap(created);

            Map<String, Object> resp = new HashMap<>();
            resp.put("user", userMap);
            resp.put("token", "dev-token");
            return ResponseEntity.ok().body(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) Map<String, String> body, jakarta.servlet.http.HttpSession session) {
        try {
            if (body == null) return ResponseEntity.badRequest().body("Missing credentials");
            String email = body.get("email");
            String password = body.get("password");
            Optional<Korisnik> userOpt = userService.authenticate(email, password);
            if (userOpt.isPresent()) {
                Korisnik u = userOpt.get();
                if ("BLOCKED".equalsIgnoreCase(u.getStatus())) {
                    return ResponseEntity.status(403).body("User is blocked");
                }
                Map<String, Object> userMap = buildUserMap(u);

                // Spremamo email u sesiju umjesto cijelog objekta koji može postati zastario
                session.setAttribute("userEmail", u.getEmail());
                // Zadržavamo "user" radi kompatibilnosti ako se negdje drugdje koristi, ali "userEmail" je primaran za /me
                session.setAttribute("user", u);

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
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> body, jakarta.servlet.http.HttpSession session) {
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
            if ("BLOCKED".equalsIgnoreCase(u.getStatus())) {
                return ResponseEntity.status(403).body("User is blocked");
            }
            Map<String, Object> userMap = buildUserMap(u);

            // Spremamo email u sesiju umjesto cijelog objekta koji može postati zastario
            session.setAttribute("userEmail", u.getEmail());
            session.setAttribute("user", u);

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

    @GetMapping("/me")
    public ResponseEntity<?> me(jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpSession session) {
        // U pravom sustavu ovdje bismo dohvatili korisnika iz SecurityContext-a (Principal)
        // Za ovaj demo, budući da nemamo puni JWT filter, ali frontend očekuje info o korisniku,
        // možemo iskoristiti cinjenicu da je korisnik vec prijavljen.
        
        // Za demo svrhe, ako nemamo Principal, pokušat ćemo vratiti korisnika iz sesije ako postoji.
        java.security.Principal principal = request.getUserPrincipal();
        String email = null;
        if (principal != null) {
            email = principal.getName();
            System.out.println("[DEBUG_LOG] AuthController.me: Found principal with name: " + email);
        } else {
            // Provjera sesije kao fallback za demo
            email = (String) session.getAttribute("userEmail");
            if (email != null) {
                System.out.println("[DEBUG_LOG] AuthController.me: Found userEmail in session: " + email);
            } else {
                Object userFromSession = session.getAttribute("user");
                if (userFromSession instanceof Korisnik) {
                    email = ((Korisnik) userFromSession).getEmail();
                    System.out.println("[DEBUG_LOG] AuthController.me: Found user in session (Korisnik): " + email);
                } else if (userFromSession instanceof Map) {
                    email = (String) ((Map<?, ?>) userFromSession).get("email");
                    System.out.println("[DEBUG_LOG] AuthController.me: Found user in session (Map): " + email);
                }
            }
        }

        if (email != null) {
            final String finalEmail = email;
            System.out.println("[DEBUG_LOG] AuthController.me: Fetching fresh user data for " + finalEmail);
            return korisnikRepository.findByEmail(finalEmail)
                    .map(u -> {
                        System.out.println("[DEBUG_LOG] AuthController.me: User found in DB, isSubscribed=" + u.isSubscribed());
                        return ResponseEntity.ok(buildUserMap(u));
                    })
                    .orElseGet(() -> {
                        System.out.println("[DEBUG_LOG] AuthController.me: User NOT found in DB for email " + finalEmail);
                        return ResponseEntity.status(401).build();
                    });
        }
        
        System.out.println("[DEBUG_LOG] AuthController.me: Not authenticated (Principal and Session empty)");
        return ResponseEntity.status(401).body("Not authenticated");
    }

    private Map<String, Object> buildUserMap(Korisnik u) {
        System.out.println("[DEBUG_LOG] Building UserMap for " + u.getEmail() + ", isSubscribed=" + u.isSubscribed());
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", u.getIdKorisnik());
        userMap.put("email", u.getEmail());
        userMap.put("firstName", u.getIme());
        userMap.put("lastName", u.getPrezime());
        userMap.put("contact", u.getBrojTelefona());
        userMap.put("address", u.getAdresa());
        userMap.put("status", u.getStatus());
        userMap.put("isSubscribed", u.isSubscribed());

        userMap.put("photoUrl", userService.resolvePhotoUrl(u));

        boolean isAdmin = userService.isAdmin(u.getIdKorisnik());
        boolean isOrg = userService.isOrganizator(u.getIdKorisnik());
        String role = isAdmin ? "ADMIN" : isOrg ? "ORGANIZATOR" : "POLAZNIK";
        userMap.put("role", role);
        userMap.put("userType", isAdmin ? "admin" : isOrg ? "organizator" : "polaznik");

        if (isOrg) {
            Organizator org = organizatorRepository.findById(u.getIdKorisnik()).orElse(null);
            userMap.put("studyName", org != null ? org.getImeStudija() : null);
            userMap.put("organizerStatus", org != null ? org.getStatusOrganizator() : null);
        }

        return userMap;
    }
}

