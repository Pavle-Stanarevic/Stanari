package com.clayplay.repository;

import com.clayplay.model.Organizator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizatorRepository extends JpaRepository<Organizator, Long> {
    boolean existsByIdKorisnik(Long idKorisnik);
    List<Organizator> findByStatusOrganizatorOrderByIdKorisnikAsc(String statusOrganizator);
    boolean existsByIdKorisnikAndStatusOrganizator(Long idKorisnik, String statusOrganizator);
}
