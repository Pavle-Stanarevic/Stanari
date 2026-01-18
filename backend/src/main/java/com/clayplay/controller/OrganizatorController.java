package com.clayplay.controller;

import com.clayplay.model.Fotografija;
import com.clayplay.model.Izlozba;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.model.Proizvod;
import com.clayplay.model.Radionica;
import com.clayplay.repository.IzlozbaRepository;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.repository.ProizvodRepository;
import com.clayplay.repository.RadionicaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizatori")
public class OrganizatorController {

    private final OrganizatorRepository organizatorRepository;
    private final RadionicaRepository radionicaRepository;
    private final IzlozbaRepository izlozbaRepository;
    private final ProizvodRepository proizvodRepository;

    public OrganizatorController(
        OrganizatorRepository organizatorRepository,
        RadionicaRepository radionicaRepository,
        IzlozbaRepository izlozbaRepository,
        ProizvodRepository proizvodRepository
    ) {
        this.organizatorRepository = organizatorRepository;
        this.radionicaRepository = radionicaRepository;
        this.izlozbaRepository = izlozbaRepository;
        this.proizvodRepository = proizvodRepository;
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

    @GetMapping("/{organizatorId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getOne(@PathVariable Long organizatorId) {
        Optional<Organizator> orgOpt = organizatorRepository.findById(organizatorId);
        if (orgOpt.isEmpty()) return ResponseEntity.notFound().build();

        Organizator org = orgOpt.get();
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
        m.put("contact", k != null ? k.getBrojTelefona() : null);
        m.put("address", k != null ? k.getAdresa() : null);
        return ResponseEntity.ok(m);
    }

    @GetMapping("/{organizatorId}/radionice")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listRadionice(
        @PathVariable Long organizatorId,
        @RequestParam(name = "type", required = false) String type
    ) {
        OffsetDateTime now = OffsetDateTime.now();
        List<Radionica> list;

        if ("past".equalsIgnoreCase(type)) {
            list = radionicaRepository
                .findByIdKorisnikAndDatVrRadionicaBeforeOrderByDatVrRadionicaDesc(organizatorId, now);
        } else if ("upcoming".equalsIgnoreCase(type)) {
            list = radionicaRepository
                .findByIdKorisnikAndDatVrRadionicaAfterOrderByDatVrRadionicaAsc(organizatorId, now);
        } else {
            list = radionicaRepository.findByIdKorisnikOrderByDatVrRadionicaAsc(organizatorId);
        }

        List<Map<String, Object>> payload = list.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getIdRadionica());
            m.put("workshopId", r.getIdRadionica());
            m.put("title", r.getNazivRadionica());
            m.put("startDateTime", r.getDatVrRadionica());
            m.put("location", r.getLokacijaRadionica());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @GetMapping("/{organizatorId}/izlozbe")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listIzlozbe(
        @PathVariable Long organizatorId,
        @RequestParam(name = "type", required = false) String type
    ) {
        OffsetDateTime now = OffsetDateTime.now();
        List<Izlozba> list;

        if ("past".equalsIgnoreCase(type)) {
            list = izlozbaRepository
                .findByIdKorisnikAndDatVrIzlozbaBeforeOrderByDatVrIzlozbaDesc(organizatorId, now);
        } else if ("upcoming".equalsIgnoreCase(type)) {
            list = izlozbaRepository
                .findByIdKorisnikAndDatVrIzlozbaAfterOrderByDatVrIzlozbaAsc(organizatorId, now);
        } else {
            list = izlozbaRepository.findByIdKorisnikOrderByDatVrIzlozbaAsc(organizatorId);
        }

        List<Map<String, Object>> payload = list.stream().map(i -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", i.getIdIzlozba());
            m.put("exhibitionId", i.getIdIzlozba());
            m.put("title", i.getNazivIzlozba());
            m.put("startDateTime", i.getDatVrIzlozba());
            m.put("location", i.getLokacijaIzlozba());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @GetMapping("/{organizatorId}/proizvodi")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listProizvodi(@PathVariable Long organizatorId) {
        List<Proizvod> list = proizvodRepository.findByIdKorisnikOrderByProizvodIdDesc(organizatorId);

        List<Map<String, Object>> payload = list.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getProizvodId());
            m.put("productId", p.getProizvodId());
            m.put("name", p.getOpisProizvod());
            m.put("title", p.getOpisProizvod());
            m.put("description", p.getOpisProizvod());
            m.put("price", p.getCijenaProizvod());
            m.put("category", p.getKategorijaProizvod());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }
}
