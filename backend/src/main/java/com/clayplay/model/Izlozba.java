package com.clayplay.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "IZLOZBA")
public class Izlozba {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idIzlozba")
    private Long idIzlozba;

    @Column(name = "nazivIzlozba", nullable = false, length = 50)
    private String nazivIzlozba;

    @Column(name = "lokacijaIzlozba", nullable = false, length = 100)
    private String lokacijaIzlozba;

    @Column(name = "opisIzlozba", length = 1000)
    private String opisIzlozba;

    @Column(name = "datVrIzlozba", nullable = false)
    private OffsetDateTime datVrIzlozba;

    @Column(name = "idKorisnik", nullable = false)
    private Long idKorisnik;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idKorisnik", referencedColumnName = "idKorisnik", insertable = false, updatable = false)
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
