package com.clayplay.repository;

import com.clayplay.model.Clanarina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClanarinaRepository extends JpaRepository<Clanarina, Long> {
    Optional<Clanarina> findByTipClanarine(String tipClanarine);
}
