package com.clayplay.controller;

import com.clayplay.dto.ProfileUpdateRequest;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.model.Placa;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.repository.PlacaRepository;
import com.clayplay.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final OrganizatorRepository organizatorRepository;
    private final PlacaRepository placaRepository;

    public UserController(UserService userService, OrganizatorRepository organizatorRepository, PlacaRepository placaRepository) {
        this.userService = userService;
        this.organizatorRepository = organizatorRepository;
        this.placaRepository = placaRepository;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable("id") Long id, @RequestBody ProfileUpdateRequest req) {
        try {
            if (userService.isBlocked(id)) return ResponseEntity.status(403).body("User is blocked");
            Korisnik updated = userService.updateProfile(id, req);
            return ResponseEntity.ok(buildUserMap(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @PostMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProfileImage(
            @PathVariable("id") Long id,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            if (userService.isBlocked(id)) return ResponseEntity.status(403).body("User is blocked");
            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest().body("Image is required");
            }
            byte[] bytes = image.getBytes();
            String contentType = image.getContentType();
            Korisnik updated = userService.updateProfileImage(id, bytes, contentType);
            return ResponseEntity.ok(buildUserMap(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable("id") Long id) {
        return userService.findById(id)
                .map(u -> ResponseEntity.ok(buildUserMap(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> buildUserMap(Korisnik updated) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", updated.getIdKorisnik());
        userMap.put("email", updated.getEmail());
        userMap.put("firstName", updated.getIme());
        userMap.put("lastName", updated.getPrezime());

        List<Placa> activeSubs = placaRepository.findActiveSubscriptions(updated.getIdKorisnik(), OffsetDateTime.now());
        boolean isSubscribed = !activeSubs.isEmpty();
        userMap.put("isSubscribed", isSubscribed);
        
        if (isSubscribed) {
            userMap.put("subscriptionEndDate", activeSubs.get(0).getDatvrKrajClanarine());
        } else {
            placaRepository.findFirstByIdKorisnikOrderByDatvrKrajClanarineDesc(updated.getIdKorisnik())
                .ifPresent(p -> userMap.put("subscriptionEndDate", p.getDatvrKrajClanarine()));
        }

        boolean isOrg = userService.isOrganizator(updated.getIdKorisnik());
        userMap.put("userType", isOrg ? "organizator" : "polaznik");
        userMap.put("contact", updated.getBrojTelefona());
        userMap.put("address", updated.getAdresa());

        userMap.put("photoUrl", userService.resolvePhotoUrl(updated));

        if (isOrg) {
            String orgStudyName = organizatorRepository.findById(updated.getIdKorisnik())
                    .map(Organizator::getImeStudija)
                    .orElse(null);
            userMap.put("studyName", orgStudyName);
        }
        return userMap;
    }
}
