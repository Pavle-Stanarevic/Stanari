package com.clayplay.repository;

import com.clayplay.model.Proizvod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProizvodRepository extends JpaRepository<Proizvod, Long> {
}
