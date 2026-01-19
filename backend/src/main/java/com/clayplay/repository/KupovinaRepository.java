package com.clayplay.repository;

import com.clayplay.model.Kupovina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KupovinaRepository extends JpaRepository<Kupovina, Long> {
    boolean existsByIdKorisnikAndProizvodId(Long idKorisnik, Long proizvodId);
}
