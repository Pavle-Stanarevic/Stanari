package com.clayplay.service;

import com.clayplay.dto.WorkshopRequest;
import com.clayplay.dto.WorkshopResponse;
import com.clayplay.model.Radionica;
import com.clayplay.repository.OrganizatorRepository;
import com.clayplay.repository.RadionicaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkshopService {

    private final RadionicaRepository radionicaRepository;
    private final OrganizatorRepository organizatorRepository;

    public WorkshopService(RadionicaRepository radionicaRepository, OrganizatorRepository organizatorRepository) {
        this.radionicaRepository = radionicaRepository;
        this.organizatorRepository = organizatorRepository;
    }

    @Transactional
    public Long create(WorkshopRequest req) {
        if (req == null) throw new IllegalArgumentException("Missing body");
        if (req.getOrganizerId() == null) throw new IllegalArgumentException("Missing organizerId");
        if (!organizatorRepository.existsByIdKorisnik(req.getOrganizerId())) {
            throw new IllegalArgumentException("Organizer does not exist");
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
                        r.getIdKorisnik()
                ))
                .collect(Collectors.toList());
    }
}
