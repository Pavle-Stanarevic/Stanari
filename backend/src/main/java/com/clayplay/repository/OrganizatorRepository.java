package com.clayplay.repository;

import com.clayplay.model.Organizator;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizatorRepository extends JpaRepository<Organizator, Long> {
    boolean existsByIdKorisnik(Long idKorisnik);
}
