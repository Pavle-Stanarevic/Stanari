package com.clayplay.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "KUPOVINA", uniqueConstraints = @UniqueConstraint(columnNames = {"idkorisnik", "proizvodid"}))
public class Kupovina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idkupovina")
    private Long idKupovina;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    @Column(name = "proizvodid", nullable = false)
    private Long proizvodId;

    @Column(name = "datkupnje", nullable = false)
    private OffsetDateTime datKupnje;

    @PrePersist
    protected void onCreate() {
        if (datKupnje == null) datKupnje = OffsetDateTime.now();
    }

    public Long getIdKupovina() { return idKupovina; }
    public void setIdKupovina(Long idKupovina) { this.idKupovina = idKupovina; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Long getProizvodId() { return proizvodId; }
    public void setProizvodId(Long proizvodId) { this.proizvodId = proizvodId; }

    public OffsetDateTime getDatKupnje() { return datKupnje; }
    public void setDatKupnje(OffsetDateTime datKupnje) { this.datKupnje = datKupnje; }
}
