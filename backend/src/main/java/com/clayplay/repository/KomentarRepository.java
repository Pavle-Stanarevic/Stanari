package com.clayplay.repository;

import com.clayplay.model.Komentar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KomentarRepository extends JpaRepository<Komentar, Long> {
    List<Komentar> findByIdIzlozbaOrderByIdKomentarDesc(Long idIzlozba);
    boolean existsByIdIzlozbaAndIdKorisnik(Long idIzlozba, Long idKorisnik);
}
