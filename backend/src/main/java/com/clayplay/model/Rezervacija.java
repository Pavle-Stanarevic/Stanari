package com.clayplay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "REZERVACIJA",
        uniqueConstraints = @UniqueConstraint(columnNames = {"idkorisnik", "idradionica"}))
public class Rezervacija {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idrezervacija")
    private Long idRezervacija;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    @Column(name = "idradionica", nullable = false)
    private Long idRadionica;

    @Column(name = "statusrez", nullable = false)
    private String statusRez = "reserved";

    public Long getIdRezervacija() { return idRezervacija; }
    public void setIdRezervacija(Long idRezervacija) { this.idRezervacija = idRezervacija; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Long getIdRadionica() { return idRadionica; }
    public void setIdRadionica(Long idRadionica) { this.idRadionica = idRadionica; }

    public String getStatusRez() { return statusRez; }
    public void setStatusRez(String statusRez) { this.statusRez = statusRez; }
}
