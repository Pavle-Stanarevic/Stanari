package com.clayplay.service;

import com.clayplay.model.Rezervacija;
import com.clayplay.repository.RezervacijaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReservationService {
    private final RezervacijaRepository rezervacijaRepository;

    public ReservationService(RezervacijaRepository rezervacijaRepository) {
        this.rezervacijaRepository = rezervacijaRepository;
    }

    @Transactional
    public Long apply(Long userId, Long workshopId) {
        if (userId == null || workshopId == null) throw new IllegalArgumentException("Missing userId or workshopId");

        Optional<Rezervacija> existing = rezervacijaRepository.findByIdKorisnikAndIdRadionica(userId, workshopId);
        if (existing.isPresent()) {
            Rezervacija r = existing.get();
            if ("reserved".equalsIgnoreCase(r.getStatusRez())) {
                throw new IllegalArgumentException("Već ste prijavljeni na radionicu.");
            }
            r.setStatusRez("reserved"); 
            return rezervacijaRepository.save(r).getIdRezervacija();
        }

        Rezervacija r = new Rezervacija();
        r.setIdKorisnik(userId);
        r.setIdRadionica(workshopId);
        r.setStatusRez("reserved");
        Rezervacija saved = rezervacijaRepository.save(r);
        return saved.getIdRezervacija();
    }

    @Transactional
    public void cancel(Long userId, Long workshopId) {
        if (userId == null || workshopId == null) throw new IllegalArgumentException("Missing userId or workshopId");
        Rezervacija r = rezervacijaRepository
                .findByIdKorisnikAndIdRadionica(userId, workshopId)
                .orElseThrow(() -> new IllegalArgumentException("Niste prijavljeni na radionicu."));

        if (!"canceled".equalsIgnoreCase(r.getStatusRez())) {
            r.setStatusRez("canceled");
            rezervacijaRepository.save(r);
        }
    }

    @Transactional(readOnly = true)
    public List<Long> reservedWorkshopIds(Long userId) {
        if (userId == null) throw new IllegalArgumentException("Missing userId");
        return rezervacijaRepository
                .findByIdKorisnikAndStatusRez(userId, "reserved")
                .stream()
                .map(Rezervacija::getIdRadionica)
                .collect(Collectors.toList());
    }
}
