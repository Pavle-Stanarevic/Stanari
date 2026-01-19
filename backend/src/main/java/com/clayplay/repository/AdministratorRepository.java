package com.clayplay.repository;

import com.clayplay.model.Administrator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdministratorRepository extends JpaRepository<Administrator, Long> {
    boolean existsByIdKorisnik(Long idKorisnik);
}
