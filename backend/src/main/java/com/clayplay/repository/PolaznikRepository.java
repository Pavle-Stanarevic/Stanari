package com.clayplay.repository;

import com.clayplay.model.Polaznik;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PolaznikRepository extends JpaRepository<Polaznik, Long> {
    boolean existsByIdKorisnik(Long idKorisnik);

    Optional<Polaznik> findByIdKorisnik(Long idKorisnik);
}
