package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "KOMENTAR")
public class Komentar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idkomentar")
    private Long idKomentar;

    @Column(name = "textkomentar", nullable = false, length = 1000)
    private String textKomentar;

    @Column(name = "idizlozba", nullable = false)
    private Long idIzlozba;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    @Column(name = "odgovaraidkomentar")
    private Long odgovaraIdKomentar;

    public Long getIdKomentar() { return idKomentar; }
    public void setIdKomentar(Long idKomentar) { this.idKomentar = idKomentar; }

    public String getTextKomentar() { return textKomentar; }
    public void setTextKomentar(String textKomentar) { this.textKomentar = textKomentar; }

    public Long getIdIzlozba() { return idIzlozba; }
    public void setIdIzlozba(Long idIzlozba) { this.idIzlozba = idIzlozba; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Long getOdgovaraIdKomentar() { return odgovaraIdKomentar; }
    public void setOdgovaraIdKomentar(Long odgovaraIdKomentar) { this.odgovaraIdKomentar = odgovaraIdKomentar; }
}
