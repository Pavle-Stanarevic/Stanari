package com.clayplay.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "placa")
public class Placa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idplacanje")
    private Long idPlacanje;

    @Column(name = "datvrpocetakclanarine", nullable = false)
    private OffsetDateTime datvrPocetakClanarine;

    @Column(name = "datvrkrajclanarine")
    private OffsetDateTime datvrKrajClanarine;

    @Column(name = "idkorisnik", nullable = false)
    private Long idKorisnik;

    @Column(name = "idclanarina", nullable = false)
    private Long idClanarina;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idkorisnik", referencedColumnName = "idkorisnik", insertable = false, updatable = false)
    private Organizator organizator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idclanarina", referencedColumnName = "idclanarina", insertable = false, updatable = false)
    private Clanarina clanarina;

    public Long getIdPlacanje() { return idPlacanje; }
    public void setIdPlacanje(Long idPlacanje) { this.idPlacanje = idPlacanje; }

    public OffsetDateTime getDatvrPocetakClanarine() { return datvrPocetakClanarine; }
    public void setDatvrPocetakClanarine(OffsetDateTime datvrPocetakClanarine) { this.datvrPocetakClanarine = datvrPocetakClanarine; }

    public OffsetDateTime getDatvrKrajClanarine() { return datvrKrajClanarine; }
    public void setDatvrKrajClanarine(OffsetDateTime datvrKrajClanarine) { this.datvrKrajClanarine = datvrKrajClanarine; }

    public Long getIdKorisnik() { return idKorisnik; }
    public void setIdKorisnik(Long idKorisnik) { this.idKorisnik = idKorisnik; }

    public Long getIdClanarina() { return idClanarina; }
    public void setIdClanarina(Long idClanarina) { this.idClanarina = idClanarina; }

    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }

    public Organizator getOrganizator() { return organizator; }
    public void setOrganizator(Organizator organizator) { this.organizator = organizator; }

    public Clanarina getClanarina() { return clanarina; }
    public void setClanarina(Clanarina clanarina) { this.clanarina = clanarina; }
}
