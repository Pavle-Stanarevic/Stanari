package com.clayplay.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class IzlozeniRepository {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void link(Long idIzlozba, Long fotoId) {
        em.createNativeQuery("INSERT INTO izlozeni (fotoId, idIzlozba) VALUES (:fid, :eid)")
                .setParameter("fid", fotoId)
                .setParameter("eid", idIzlozba)
                .executeUpdate();
    }

    @SuppressWarnings("unchecked")
    public List<String> findImageUrls(Long idIzlozba) {
        try {
            List<Object> res = em.createNativeQuery(
                            "SELECT f.fotoURL FROM izlozeni i " +
                            "JOIN FOTOGRAFIJA f ON f.fotoId = i.fotoId " +
                            "WHERE i.idIzlozba = :eid ORDER BY f.fotoId ASC")
                    .setParameter("eid", idIzlozba)
                    .getResultList();
            return res.stream().map(v -> v != null ? String.valueOf(v) : null)
                    .filter(v -> v != null && !v.isBlank())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }
}
