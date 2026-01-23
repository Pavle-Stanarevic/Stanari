package com.clayplay.repository;

import com.clayplay.model.Rezervacija;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RezervacijaRepository extends JpaRepository<Rezervacija, Long> {
    Optional<Rezervacija> findByIdKorisnikAndIdRadionica(Long idKorisnik, Long idRadionica);
    boolean existsByIdKorisnikAndIdRadionica(Long idKorisnik, Long idRadionica);
    List<Rezervacija> findByIdKorisnikAndStatusRez(Long idKorisnik, String statusRez);
}
