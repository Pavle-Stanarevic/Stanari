package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "RECENZIJA", uniqueConstraints = @UniqueConstraint(columnNames = {"proizvodid", "idkorisnik"}))
public class Recenzija {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idrecenzija")
    private Long idRecenzija;

    @Column(name = "ocjena", nullable = false)
    private Integer ocjena;

    @Column(name = "textrecenzija", length = 1000)
    private String textRecenzija;

    @Column(name = "proizvodid", nullable = false)
    private Long proizvodId;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    public Long getIdRecenzija() { return idRecenzija; }
    public void setIdRecenzija(Long idRecenzija) { this.idRecenzija = idRecenzija; }

    public Integer getOcjena() { return ocjena; }
    public void setOcjena(Integer ocjena) { this.ocjena = ocjena; }

    public String getTextRecenzija() { return textRecenzija; }
    public void setTextRecenzija(String textRecenzija) { this.textRecenzija = textRecenzija; }

    public Long getProizvodId() { return proizvodId; }
    public void setProizvodId(Long proizvodId) { this.proizvodId = proizvodId; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }
}
