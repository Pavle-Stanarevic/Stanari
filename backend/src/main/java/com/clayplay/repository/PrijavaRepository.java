package com.clayplay.repository;

import com.clayplay.model.Prijava;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrijavaRepository extends JpaRepository<Prijava, Long> {
    Optional<Prijava> findByIdKorisnikAndIdIzlozba(Long idKorisnik, Long idIzlozba);
    List<Prijava> findByIdKorisnik(Long idKorisnik);
    List<Prijava> findByIdKorisnikAndStatusIzlozbaIn(Long idKorisnik, List<String> statuses);
    List<Prijava> findByIdIzlozbaAndStatusIzlozba(Long idIzlozba, String statusIzlozba);
    Optional<Prijava> findByIdPrijavaAndIdIzlozba(Long idPrijava, Long idIzlozba);
}
