package com.clayplay.service;

import com.clayplay.dto.WorkshopRequest;
import com.clayplay.dto.WorkshopResponse;
import com.clayplay.model.Fotografija;
import com.clayplay.model.Radionica;
import com.clayplay.repository.FotoRadRepository;
import com.clayplay.repository.FotografijaRepository;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.repository.PlacaRepository;
import com.clayplay.repository.RadionicaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkshopService {

    private final RadionicaRepository radionicaRepository;
    private final OrganizatorRepository organizatorRepository;
    private final PlacaRepository placaRepository;
    private final FotografijaRepository fotografijaRepository;
    private final FotoRadRepository fotoRadRepository;
    private final FileStorageService fileStorageService;
    private final WorkshopNotificationEmailService workshopNotificationEmailService;

    public WorkshopService(RadionicaRepository radionicaRepository,
                           OrganizatorRepository organizatorRepository,
                           PlacaRepository placaRepository,
                           FotografijaRepository fotografijaRepository,
                           FotoRadRepository fotoRadRepository,
                           FileStorageService fileStorageService,
                           WorkshopNotificationEmailService workshopNotificationEmailService) {
        this.radionicaRepository = radionicaRepository;
        this.organizatorRepository = organizatorRepository;
        this.placaRepository = placaRepository;
        this.fotografijaRepository = fotografijaRepository;
        this.fotoRadRepository = fotoRadRepository;
        this.fileStorageService = fileStorageService;
        this.workshopNotificationEmailService = workshopNotificationEmailService;
    }

    @Transactional
    public Long create(WorkshopRequest req) {
        if (req == null) throw new IllegalArgumentException("Missing body");
        if (req.getOrganizerId() == null) throw new IllegalArgumentException("Missing organizerId");
        if (!organizatorRepository.existsByIdKorisnikAndStatusOrganizator(req.getOrganizerId(), "APPROVED")) {
            throw new IllegalArgumentException("Organizer is not approved");
        }
        if (placaRepository.findActiveSubscriptions(req.getOrganizerId(), OffsetDateTime.now()).isEmpty()) {
            throw new IllegalArgumentException("Active subscription is required");
        }
        if (req.getTitle() == null || req.getTitle().isBlank()) throw new IllegalArgumentException("Missing title");
        if (req.getLocation() == null || req.getLocation().isBlank()) throw new IllegalArgumentException("Missing location");
        if (req.getCapacity() == null) throw new IllegalArgumentException("Missing capacity");
        if (req.getPrice() == null) throw new IllegalArgumentException("Missing price");
        if (req.getDateISO() == null || req.getDateISO().isBlank()) throw new IllegalArgumentException("Missing dateISO");

        OffsetDateTime when = OffsetDateTime.parse(req.getDateISO());

        Radionica r = new Radionica();
        r.setNazivRadionica(req.getTitle());
        r.setOpisRadionica(req.getDescription() == null ? "" : req.getDescription());
        r.setTrajanje(Duration.ofMinutes(req.getDurationMinutes() == null ? 0 : req.getDurationMinutes()));
        r.setDatVrRadionica(when);
        r.setLokacijaRadionica(req.getLocation());
        r.setBrSlobMjesta(req.getCapacity());
        r.setCijenaRadionica(BigDecimal.valueOf(req.getPrice()));
        r.setIdKorisnik(req.getOrganizerId());

        Radionica saved = radionicaRepository.save(r);

        try {
            workshopNotificationEmailService.notifyAllSubscribedPolaznici(req.getOrganizerId(), saved);
        } catch (Exception ignored) { }

        return saved.getIdRadionica();
    }

    @Transactional(readOnly = true)
    public List<WorkshopResponse> listRecent(int limit) {
        return radionicaRepository
            .findAllByOrderByDatVrRadionicaAsc(PageRequest.of(0, Math.max(1, limit)))
                .stream()
                .map(r -> new WorkshopResponse(
                        r.getIdRadionica(),
                        r.getNazivRadionica(),
                        r.getOpisRadionica(),
                        r.getTrajanje() == null ? null : (int) r.getTrajanje().toMinutes(),
                        r.getDatVrRadionica(),
                        r.getLokacijaRadionica(),
                        r.getBrSlobMjesta(),
                        r.getCijenaRadionica() == null ? null : r.getCijenaRadionica().doubleValue(),
                        r.getIdKorisnik(),
                        fotografijaRepository.findUrlsByRadionicaId(r.getIdRadionica())
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<String> addPhotos(Long workshopId, List<MultipartFile> images) {
        if (workshopId == null) throw new IllegalArgumentException("Missing workshop id");
        if (images == null || images.isEmpty()) throw new IllegalArgumentException("Images are required");

        Radionica r = radionicaRepository.findById(workshopId)
                .orElseThrow(() -> new IllegalArgumentException("Workshop not found"));

        java.util.ArrayList<String> urls = new java.util.ArrayList<>();
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty()) continue;
            byte[] bytes;
            try {
                bytes = image.getBytes();
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid image");
            }
            String contentType = image.getContentType();
            String publicUrl = fileStorageService.save(bytes, contentType);
            Fotografija f = new Fotografija();
            f.setFotoURL(publicUrl);
            Fotografija savedFoto = fotografijaRepository.save(f);
            fotoRadRepository.insertLink(savedFoto.getFotoId(), r.getIdRadionica());
            urls.add(publicUrl);
        }
        return urls;
    }

    @Transactional(readOnly = true)
    public List<String> listPhotoUrls(Long workshopId) {
        if (workshopId == null) throw new IllegalArgumentException("Missing workshop id");
        return fotografijaRepository.findUrlsByRadionicaId(workshopId);
    }
}
