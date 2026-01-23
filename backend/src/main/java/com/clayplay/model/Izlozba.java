package com.clayplay.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "IZLOZBA")
public class Izlozba {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idizlozba")
    private Long idIzlozba;

    @Column(name = "nazivizlozba", nullable = false, length = 50)
    private String nazivIzlozba;

    @Column(name = "lokacijaizlozba", nullable = false, length = 100)
    private String lokacijaIzlozba;

    @Column(name = "opisizlozba", length = 1000)
    private String opisIzlozba;

    @Column(name = "datvrizlozba", nullable = false)
    private OffsetDateTime datVrIzlozba;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idkorisnik", referencedColumnName = "idkorisnik", insertable = false, updatable = false)
    private Organizator organizator;

    public Long getIdIzlozba() { return idIzlozba; }
    public void setIdIzlozba(Long idIzlozba) { this.idIzlozba = idIzlozba; }

    public String getNazivIzlozba() { return nazivIzlozba; }
    public void setNazivIzlozba(String nazivIzlozba) { this.nazivIzlozba = nazivIzlozba; }

    public String getLokacijaIzlozba() { return lokacijaIzlozba; }
    public void setLokacijaIzlozba(String lokacijaIzlozba) { this.lokacijaIzlozba = lokacijaIzlozba; }

    public String getOpisIzlozba() { return opisIzlozba; }
    public void setOpisIzlozba(String opisIzlozba) { this.opisIzlozba = opisIzlozba; }

    public OffsetDateTime getDatVrIzlozba() { return datVrIzlozba; }
    public void setDatVrIzlozba(OffsetDateTime datVrIzlozba) { this.datVrIzlozba = datVrIzlozba; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Organizator getOrganizator() { return organizator; }
    public void setOrganizator(Organizator organizator) { this.organizator = organizator; }
}
