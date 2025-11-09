package com.clayplay.repository;

import com.clayplay.model.Polaznik;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolaznikRepository extends JpaRepository<Polaznik, Long> {
    boolean existsByIdKorisnik(Long idKorisnik);
}
