package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "PRIJAVA",
        uniqueConstraints = @UniqueConstraint(columnNames = {"idKorisnik", "idIzlozba"}))
public class Prijava {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idPrijava")
    private Long idPrijava;

    @Column(name = "statusIzlozba", nullable = false)
    private String statusIzlozba = "pending";

    @Column(name = "idKorisnik", nullable = false)
    private Long idKorisnik;

    @Column(name = "idIzlozba", nullable = false)
    private Long idIzlozba;

    public Long getIdPrijava() { return idPrijava; }
    public void setIdPrijava(Long idPrijava) { this.idPrijava = idPrijava; }

    public String getStatusIzlozba() { return statusIzlozba; }
    public void setStatusIzlozba(String statusIzlozba) { this.statusIzlozba = statusIzlozba; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Long getIdIzlozba() { return idIzlozba; }
    public void setIdIzlozba(Long idIzlozba) { this.idIzlozba = idIzlozba; }
}
