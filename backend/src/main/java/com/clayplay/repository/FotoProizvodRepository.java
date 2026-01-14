package com.clayplay.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class FotoProizvodRepository {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void link(Long proizvodId, Long fotoId) {
        em.createNativeQuery("INSERT INTO fotoProizvod (proizvodId, fotoId) VALUES (:pid, :fid)")
                .setParameter("pid", proizvodId)
                .setParameter("fid", fotoId)
                .executeUpdate();
    }

    public String findFirstImageUrl(Long proizvodId) {
        try {
            Object res = em.createNativeQuery(
                            "SELECT f.fotoURL FROM fotoProizvod fp " +
                            "JOIN FOTOGRAFIJA f ON f.fotoId = fp.fotoId " +
                            "WHERE fp.proizvodId = :pid ORDER BY f.fotoId ASC LIMIT 1")
                    .setParameter("pid", proizvodId)
                    .getSingleResult();
            return res != null ? String.valueOf(res) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
