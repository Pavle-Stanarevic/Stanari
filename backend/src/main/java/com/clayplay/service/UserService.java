package com.clayplay.service;

import com.clayplay.dto.ProfileUpdateRequest;
import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.Fotografija;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Organizator;
import com.clayplay.model.Polaznik;
import com.clayplay.repository.AdministratorRepository;
import com.clayplay.repository.FotografijaRepository;
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
    private final AdministratorRepository administratorRepository;
    private final FotografijaRepository fotografijaRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    public UserService(KorisnikRepository korisnikRepository, OrganizatorRepository organizatorRepository, PolaznikRepository polaznikRepository, AdministratorRepository administratorRepository, FotografijaRepository fotografijaRepository, PasswordEncoder passwordEncoder, FileStorageService fileStorageService) {
        this.korisnikRepository = korisnikRepository;
        this.organizatorRepository = organizatorRepository;
        this.polaznikRepository = polaznikRepository;
        this.administratorRepository = administratorRepository;
        this.fotografijaRepository = fotografijaRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public Korisnik register(RegistrationRequest req) {
        return register(req, null, null);
    }

    @Transactional
    public Korisnik register(RegistrationRequest req, byte[] imageBytes, String contentType) {
        if (req == null) throw new IllegalArgumentException("Invalid registration data");
        if (req.password == null || !req.password.equals(req.confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        Optional<Korisnik> exists = korisnikRepository.findByEmail(req.email);
        if (exists.isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        boolean isOrg = "organizator".equalsIgnoreCase(req.userType);
        if (isOrg && (imageBytes == null || imageBytes.length == 0)) {
            throw new IllegalArgumentException("Image is required for organizator");
        }

        Korisnik k = new Korisnik();
        k.setIme(req.firstName);
        k.setPrezime(req.lastName);
        k.setAdresa(req.address);
        k.setBrojTelefona(req.contact);
        k.setEmail(req.email);
        k.setPassword(passwordEncoder.encode(req.password));

        if (imageBytes != null && imageBytes.length > 0) {
            String publicUrl = fileStorageService.save(imageBytes, contentType);
            Fotografija f = new Fotografija();
            f.setFotoURL(publicUrl);
            Fotografija savedFoto = fotografijaRepository.save(f);
            k.setFotoId(savedFoto.getFotoId());
        }

        Korisnik saved = korisnikRepository.save(k);

        if (isOrg) {
            Organizator o = new Organizator();
            o.setIdKorisnik(saved.getIdKorisnik());
            o.setImeStudija(req.studyName);
            o.setStatusOrganizator("APPROVED");
            organizatorRepository.save(o);
        } else {
            Polaznik p = new Polaznik();
            p.setIdKorisnik(saved.getIdKorisnik());
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

    public boolean isApprovedOrganizator(Long idKorisnik) {
        return organizatorRepository.existsByIdKorisnikAndStatusOrganizator(idKorisnik, "APPROVED");
    }

    public boolean isPolaznik(Long idKorisnik) {
        return polaznikRepository.existsByIdKorisnik(idKorisnik);
    }

    public boolean isAdmin(Long idKorisnik) {
        return administratorRepository.existsByIdKorisnik(idKorisnik);
    }

    @Transactional
    public Korisnik updateProfile(Long idKorisnik, ProfileUpdateRequest req) {
        if (idKorisnik == null) throw new IllegalArgumentException("Missing user id");
        if (req == null) throw new IllegalArgumentException("Invalid profile data");

        Korisnik u = korisnikRepository.findById(idKorisnik)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (req.firstName != null) u.setIme(req.firstName);
        if (req.lastName != null) u.setPrezime(req.lastName);
        if (req.address != null) u.setAdresa(req.address);
        if (req.contact != null) u.setBrojTelefona(req.contact);

        if (req.email != null && !req.email.equals(u.getEmail())) {
            Optional<Korisnik> exists = korisnikRepository.findByEmail(req.email);
            if (exists.isPresent()) {
                throw new IllegalArgumentException("Email already registered");
            }
            u.setEmail(req.email);
        }

        Korisnik saved = korisnikRepository.save(u);

        if (req.studyName != null && isOrganizator(idKorisnik)) {
            organizatorRepository.findById(idKorisnik).ifPresent(org -> {
                org.setImeStudija(req.studyName);
                organizatorRepository.save(org);
            });
        }

        return saved;
    }
}
