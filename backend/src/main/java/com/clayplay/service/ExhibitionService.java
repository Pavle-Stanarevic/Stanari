package com.clayplay.service;

import com.clayplay.dto.ExhibitionResponse;
import com.clayplay.model.Fotografija;
import com.clayplay.model.Izlozba;
import com.clayplay.repository.FotografijaRepository;
import com.clayplay.repository.IzlozbaRepository;
import com.clayplay.repository.IzlozeniRepository;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.repository.PlacaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExhibitionService {

    private final IzlozbaRepository izlozbaRepository;
    private final OrganizatorRepository organizatorRepository;
    private final PlacaRepository placaRepository;
    private final FotografijaRepository fotografijaRepository;
    private final IzlozeniRepository izlozeniRepository;
    private final FileStorageService storage;

    public ExhibitionService(IzlozbaRepository izlozbaRepository,
                             OrganizatorRepository organizatorRepository,
                             PlacaRepository placaRepository,
                             FotografijaRepository fotografijaRepository,
                             IzlozeniRepository izlozeniRepository,
                             FileStorageService storage) {
        this.izlozbaRepository = izlozbaRepository;
        this.organizatorRepository = organizatorRepository;
        this.placaRepository = placaRepository;
        this.fotografijaRepository = fotografijaRepository;
        this.izlozeniRepository = izlozeniRepository;
        this.storage = storage;
    }

    @Transactional
    public Long create(Long organizerId, String title, String location, String description, OffsetDateTime startDateTime, List<MultipartFile> images) {
        if (organizerId == null) throw new IllegalArgumentException("Missing organizerId");
        if (!organizatorRepository.existsByIdKorisnikAndStatusOrganizator(organizerId, "APPROVED")) {
            throw new IllegalArgumentException("Organizer is not approved");
        }
        if (placaRepository.findActiveSubscriptions(organizerId, OffsetDateTime.now()).isEmpty()) {
            throw new IllegalArgumentException("Active subscription is required");
        }
        if (title == null || title.isBlank()) throw new IllegalArgumentException("Missing title");
        if (location == null || location.isBlank()) throw new IllegalArgumentException("Missing location");
        if (startDateTime == null) throw new IllegalArgumentException("Missing startDateTime");

        Izlozba iz = new Izlozba();
        iz.setNazivIzlozba(title);
        iz.setLokacijaIzlozba(location);
        iz.setOpisIzlozba(description == null ? "" : description);
        iz.setDatVrIzlozba(startDateTime);
        iz.setIdKorisnik(organizerId);
        Izlozba saved = izlozbaRepository.save(iz);

        List<MultipartFile> imgs = images == null ? new ArrayList<>() : images;
        for (MultipartFile f : imgs) {
            if (f == null || f.isEmpty()) continue;
            byte[] bytes;
            try {
                bytes = f.getBytes();
            } catch (Exception e) {
                continue;
            }
            if (bytes.length == 0) continue;
            String url = storage.save(bytes, f.getContentType());
            Fotografija photo = new Fotografija();
            photo.setFotoURL(url);
            Fotografija savedFoto = fotografijaRepository.save(photo);
            izlozeniRepository.link(saved.getIdIzlozba(), savedFoto.getFotoId());
        }

        return saved.getIdIzlozba();
    }

    @Transactional(readOnly = true)
    public List<ExhibitionResponse> listAll() {
        return izlozbaRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    private ExhibitionResponse toDto(Izlozba iz) {
        ExhibitionResponse r = new ExhibitionResponse();
        r.id = iz.getIdIzlozba();
        r.title = iz.getNazivIzlozba();
        r.description = iz.getOpisIzlozba();
        r.location = iz.getLokacijaIzlozba();
        r.startDateTime = iz.getDatVrIzlozba();
        r.organizerId = iz.getIdKorisnik();
        r.imageUrls = izlozeniRepository.findImageUrls(iz.getIdIzlozba());
        return r;
    }
}
