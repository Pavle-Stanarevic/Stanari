package com.clayplay.service;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.model.Polaznik;
import com.clayplay.repository.KorisnikRepository;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.repository.PolaznikRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final KorisnikRepository korisnikRepository;
    private final OrganizatorRepository organizatorRepository;
    private final PolaznikRepository polaznikRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(KorisnikRepository korisnikRepository, OrganizatorRepository organizatorRepository, PolaznikRepository polaznikRepository, PasswordEncoder passwordEncoder) {
        this.korisnikRepository = korisnikRepository;
        this.organizatorRepository = organizatorRepository;
        this.polaznikRepository = polaznikRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Korisnik register(RegistrationRequest req) {
        if (req == null) throw new IllegalArgumentException("Invalid registration data");
        if (req.password == null || !req.password.equals(req.confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        Optional<Korisnik> exists = korisnikRepository.findByEmail(req.email);
        if (exists.isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        Korisnik k = new Korisnik();
        k.setIme(req.firstName);
        k.setPrezime(req.lastName);
        k.setAdresa(req.address);
        k.setBrojTelefona(req.contact);
        k.setEmail(req.email);
        k.setPassword(passwordEncoder.encode(req.password));

        Korisnik saved = korisnikRepository.save(k);

        if ("organizator".equalsIgnoreCase(req.userType)) {
            Organizator o = new Organizator();
            o.setIdKorisnik(saved.getIdKorisnik());
            // imeStudija is nullable in DB; we simply pass along what we got
            o.setImeStudija(req.studyName);
            organizatorRepository.save(o);
        } else {
            Polaznik p = new Polaznik();
            p.setIdKorisnik(saved.getIdKorisnik());
            // default zeliObavijesti = false; can be set from req later if needed
            polaznikRepository.save(p);
        }

        return saved;
    }

    public Optional<Korisnik> authenticate(String email, String password) {
        if (email == null || password == null) return Optional.empty();
        Optional<Korisnik> opt = korisnikRepository.findByEmail(email);
        if (opt.isPresent() && passwordEncoder.matches(password, opt.get().getPassword())) {
            return opt;
        }
        return Optional.empty();
    }

    public boolean isOrganizator(Long idKorisnik) {
        return organizatorRepository.existsByIdKorisnik(idKorisnik);
    }
}
