package com.clayplay.service;

import com.clayplay.model.Prijava;
import com.clayplay.repository.PrijavaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clayplay.dto.ExhibitionApplicationResponse;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExhibitionReservationService {

    private final PrijavaRepository prijavaRepository;

    public ExhibitionReservationService(PrijavaRepository prijavaRepository) {
        this.prijavaRepository = prijavaRepository;
    }

    @Transactional
    public Long apply(Long userId, Long exhibitionId) {
        if (userId == null || exhibitionId == null) throw new IllegalArgumentException("Missing userId or exhibitionId");
        if (prijavaRepository.findByIdKorisnikAndIdIzlozba(userId, exhibitionId).isPresent()) {
            throw new IllegalArgumentException("Već ste prijavljeni na izložbu.");
        }
        Prijava p = new Prijava();
        p.setIdKorisnik(userId);
        p.setIdIzlozba(exhibitionId);
        p.setStatusIzlozba("pending");
        return prijavaRepository.save(p).getIdPrijava();
    }

    @Transactional(readOnly = true)
    public List<Long> reservedExhibitionIds(Long userId) {
        List<String> statuses = Arrays.asList("pending", "accepted");
        return prijavaRepository.findByIdKorisnikAndStatusIzlozbaIn(userId, statuses)
                .stream()
                .map(Prijava::getIdIzlozba)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExhibitionApplicationResponse> applicationStatuses(Long userId) {
        return prijavaRepository.findByIdKorisnik(userId)
                .stream()
                .map(p -> new ExhibitionApplicationResponse(p.getIdIzlozba(), p.getStatusIzlozba()))
                .collect(Collectors.toList());
    }
}
