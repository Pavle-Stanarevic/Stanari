package com.clayplay.controller;

import com.clayplay.dto.ProfileUpdateRequest;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final OrganizatorRepository organizatorRepository;

    public UserController(UserService userService, OrganizatorRepository organizatorRepository) {
        this.userService = userService;
        this.organizatorRepository = organizatorRepository;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable("id") Long id, @RequestBody ProfileUpdateRequest req) {
        try {
            Korisnik updated = userService.updateProfile(id, req);
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", updated.getIdKorisnik());
            userMap.put("email", updated.getEmail());
            userMap.put("firstName", updated.getIme());
            userMap.put("lastName", updated.getPrezime());
            boolean isOrg = userService.isOrganizator(updated.getIdKorisnik());
            userMap.put("userType", isOrg ? "organizator" : "polaznik");
            userMap.put("contact", updated.getBrojTelefona());
            userMap.put("address", updated.getAdresa());
            if (isOrg) {
                String orgStudyName = organizatorRepository.findById(updated.getIdKorisnik())
                        .map(Organizator::getImeStudija)
                        .orElse(null);
                userMap.put("studyName", orgStudyName);
            }
            return ResponseEntity.ok(userMap);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error");
        }
    }
}
