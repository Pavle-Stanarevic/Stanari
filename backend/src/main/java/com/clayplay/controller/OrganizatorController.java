package com.clayplay.controller;

import com.clayplay.model.Fotografija;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.repository.OrganizatorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizatori")
public class OrganizatorController {

    private final OrganizatorRepository organizatorRepository;

    public OrganizatorController(OrganizatorRepository organizatorRepository) {
        this.organizatorRepository = organizatorRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> listAll() {
        List<Organizator> all = organizatorRepository.findAll();
        List<Map<String, Object>> payload = all.stream().map(org -> {
            Korisnik k = org.getKorisnik();
            Fotografija f = k != null ? k.getFotografija() : null;
            Map<String, Object> m = new HashMap<>();
            m.put("id", org.getIdKorisnik());
            m.put("idKorisnik", org.getIdKorisnik());
            m.put("firstName", k != null ? k.getIme() : null);
            m.put("lastName", k != null ? k.getPrezime() : null);
            m.put("email", k != null ? k.getEmail() : null);
            m.put("studyName", org.getImeStudija());
            m.put("photoUrl", f != null ? f.getFotoURL() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }
}
