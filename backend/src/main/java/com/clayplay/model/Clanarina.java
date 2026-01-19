package com.clayplay.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "CLANARINA")
public class Clanarina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idClanarina")
    private Long idClanarina;

    @Column(name = "iznosEUR", nullable = false)
    private BigDecimal iznosEUR;

    @Column(name = "tipClanarine", nullable = false)
    private String tipClanarine;

    public Long getIdClanarina() { return idClanarina; }
    public void setIdClanarina(Long idClanarina) { this.idClanarina = idClanarina; }

    public BigDecimal getIznosEUR() { return iznosEUR; }
    public void setIznosEUR(BigDecimal iznosEUR) { this.iznosEUR = iznosEUR; }

    public String getTipClanarine() { return tipClanarine; }
    public void setTipClanarine(String tipClanarine) { this.tipClanarine = tipClanarine; }
}
