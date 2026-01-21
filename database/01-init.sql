CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE FOTOGRAFIJA
(
  fotourl TEXT NOT NULL,
  fotoid BIGINT GENERATED ALWAYS AS IDENTITY,
  PRIMARY KEY (fotoid),
  UNIQUE (fotourl)
);

CREATE TABLE CLANARINA
(
  iznoseur NUMERIC(10, 2) NOT NULL,
  tipclanarine VARCHAR(50) NOT NULL,
  idclanarina BIGINT GENERATED ALWAYS AS IDENTITY,
  PRIMARY KEY (idclanarina)
);

CREATE TABLE KORISNIK
(
  password VARCHAR(100) NOT NULL,
  email CITEXT NOT NULL,
  idkorisnik BIGINT GENERATED ALWAYS AS IDENTITY,
  ime VARCHAR(50),
  prezime VARCHAR(50),
  adresa VARCHAR(100),
  brojtelefona VARCHAR(15),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  fotoid BIGINT,
  PRIMARY KEY (idkorisnik),
  FOREIGN KEY (fotoid) REFERENCES FOTOGRAFIJA(fotoid) ON DELETE SET NULL,
  UNIQUE (email),
  UNIQUE (brojtelefona)
);

CREATE TABLE ORGANIZATOR
(
  imestudija VARCHAR(50),
  status_organizator TEXT NOT NULL DEFAULT 'APPROVED',
  idkorisnik BIGINT NOT NULL,
  PRIMARY KEY (idkorisnik),
  FOREIGN KEY (idkorisnik) REFERENCES KORISNIK(idkorisnik) ON DELETE CASCADE
);

CREATE TABLE POLAZNIK
(
  zeliobavijesti BOOLEAN NOT NULL DEFAULT FALSE,
  idkorisnik BIGINT NOT NULL,
  PRIMARY KEY (idkorisnik),
  FOREIGN KEY (idkorisnik) REFERENCES KORISNIK(idkorisnik) ON DELETE CASCADE
);

CREATE TABLE ADMINISTRATOR
(
  idkorisnik BIGINT NOT NULL,
  PRIMARY KEY (idkorisnik),
  FOREIGN KEY (idkorisnik) REFERENCES KORISNIK(idkorisnik) ON DELETE CASCADE
);

CREATE TABLE RADIONICA
(
  nazivradionica VARCHAR(50) NOT NULL,
  opisradionica VARCHAR(1000) NOT NULL,
  trajanje INTERVAL NOT NULL,
  datvrradionica TIMESTAMPTZ NOT NULL,
  lokacijaradionica VARCHAR(100) NOT NULL,
  brslobmjesta INT NOT NULL,
  cijenaradionica NUMERIC(10, 2) NOT NULL,
  idradionica BIGINT GENERATED ALWAYS AS IDENTITY,
  idkorisnik BIGINT NOT NULL,
  PRIMARY KEY (idradionica),
  FOREIGN KEY (idkorisnik) REFERENCES ORGANIZATOR(idkorisnik) ON DELETE CASCADE,
  CONSTRAINT chk_brslobmjesta CHECK (brslobmjesta >= 0)
);

CREATE TABLE PROIZVOD
(
  opisproizvod VARCHAR(1000),
  cijenaproizvod NUMERIC(10, 2) NOT NULL,
  kategorijaproizvod VARCHAR(50) NOT NULL,
  kupljen BOOLEAN NOT NULL DEFAULT FALSE,
  proizvodid BIGINT GENERATED ALWAYS AS IDENTITY,
  idkorisnik BIGINT NOT NULL,
  PRIMARY KEY (proizvodid),
  FOREIGN KEY (idkorisnik) REFERENCES ORGANIZATOR(idkorisnik) ON DELETE CASCADE
);

CREATE TABLE KUPOVINA
(
  idkupovina BIGINT GENERATED ALWAYS AS IDENTITY,
  idkorisnik BIGINT NOT NULL,
  proizvodid BIGINT NOT NULL,
  datkupnje TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (idkupovina),
  FOREIGN KEY (idkorisnik) REFERENCES POLAZNIK(idkorisnik) ON DELETE CASCADE,
  FOREIGN KEY (proizvodid) REFERENCES PROIZVOD(proizvodid) ON DELETE CASCADE,
  UNIQUE (idkorisnik, proizvodid)
);

CREATE TABLE RECENZIJA
(
  ocjena INT NOT NULL,
  textrecenzija VARCHAR(1000),
  idrecenzija BIGINT GENERATED ALWAYS AS IDENTITY,
  proizvodid BIGINT NOT NULL,
  idkorisnik BIGINT NOT NULL,
  PRIMARY KEY (idrecenzija),
  FOREIGN KEY (proizvodid) REFERENCES PROIZVOD(proizvodid) ON DELETE CASCADE,
  FOREIGN KEY (idkorisnik) REFERENCES POLAZNIK(idkorisnik) ON DELETE CASCADE,
  UNIQUE (proizvodid, idkorisnik),
  CONSTRAINT chk_ocjena CHECK (ocjena BETWEEN 1 AND 5)
);

CREATE TABLE IZLOZBA
(
  nazivizlozba VARCHAR(50) NOT NULL,
  lokacijaizlozba VARCHAR(100) NOT NULL,
  opisizlozba VARCHAR(1000),
  datvrizlozba TIMESTAMPTZ NOT NULL,
  idizlozba BIGINT GENERATED ALWAYS AS IDENTITY,
  idkorisnik BIGINT NOT NULL,
  PRIMARY KEY (idizlozba),
  FOREIGN KEY (idkorisnik) REFERENCES ORGANIZATOR(idkorisnik) ON DELETE CASCADE
);

CREATE TABLE PRIJAVA
(
  idprijava BIGINT GENERATED ALWAYS AS IDENTITY,
  statusizlozba TEXT NOT NULL DEFAULT 'pending',
  idkorisnik BIGINT NOT NULL,
  idizlozba BIGINT NOT NULL,
  PRIMARY KEY (idprijava),
  FOREIGN KEY (idkorisnik) REFERENCES POLAZNIK(idkorisnik) ON DELETE CASCADE,
  FOREIGN KEY (idizlozba) REFERENCES IZLOZBA(idizlozba) ON DELETE CASCADE,
  UNIQUE (idkorisnik, idizlozba),
  CONSTRAINT chk_statusizlozba CHECK (statusizlozba IN ('accepted', 'rejected', 'pending'))
);

CREATE TABLE REZERVACIJA
(
  idrezervacija BIGINT GENERATED ALWAYS AS IDENTITY,
  idkorisnik BIGINT NOT NULL,
  idradionica BIGINT NOT NULL,
  statusrez TEXT NOT NULL DEFAULT 'reserved',
  PRIMARY KEY (idrezervacija),
  UNIQUE (idkorisnik, idradionica),
  FOREIGN KEY (idkorisnik) REFERENCES POLAZNIK(idkorisnik) ON DELETE CASCADE,
  FOREIGN KEY (idradionica) REFERENCES RADIONICA(idradionica) ON DELETE CASCADE,
  CONSTRAINT chk_statusrez CHECK (statusrez IN ('canceled', 'reserved'))
);

CREATE TABLE fotoRad
(
  fotoid BIGINT NOT NULL,
  idradionica BIGINT NOT NULL,
  PRIMARY KEY (fotoid, idradionica),
  FOREIGN KEY (fotoid) REFERENCES FOTOGRAFIJA(fotoid) ON DELETE CASCADE,
  FOREIGN KEY (idradionica) REFERENCES RADIONICA(idradionica) ON DELETE CASCADE
);

CREATE TABLE izlozeni
(
  fotoid BIGINT NOT NULL,
  idizlozba BIGINT NOT NULL,
  PRIMARY KEY (fotoid, idizlozba),
  FOREIGN KEY (fotoid) REFERENCES FOTOGRAFIJA(fotoid) ON DELETE CASCADE,
  FOREIGN KEY (idizlozba) REFERENCES IZLOZBA(idizlozba) ON DELETE CASCADE
);

CREATE TABLE placa
(
  idplacanje BIGINT GENERATED ALWAYS AS IDENTITY,
  datvrpocetakclanarine TIMESTAMPTZ NOT NULL,
  datvrkrajclanarine TIMESTAMPTZ,
  idkorisnik BIGINT NOT NULL,
  idclanarina BIGINT NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  PRIMARY KEY (idplacanje),
  FOREIGN KEY (idkorisnik) REFERENCES ORGANIZATOR(idkorisnik) ON DELETE CASCADE,
  FOREIGN KEY (idclanarina) REFERENCES CLANARINA(idclanarina) ON DELETE CASCADE
);

CREATE TABLE fotoProizvod
(
  proizvodid BIGINT NOT NULL,
  fotoid BIGINT NOT NULL,
  PRIMARY KEY (proizvodid, fotoid),
  FOREIGN KEY (proizvodid) REFERENCES PROIZVOD(proizvodid) ON DELETE CASCADE,
  FOREIGN KEY (fotoid) REFERENCES FOTOGRAFIJA(fotoid) ON DELETE CASCADE
);

CREATE TABLE KOMENTAR
(
  textkomentar VARCHAR(1000) NOT NULL,
  idkomentar BIGINT GENERATED ALWAYS AS IDENTITY,
  idizlozba BIGINT NOT NULL,
  idkorisnik BIGINT NOT NULL,
  odgovaraidkomentar BIGINT,
  PRIMARY KEY (idkomentar),
  FOREIGN KEY (idizlozba) REFERENCES IZLOZBA(idizlozba) ON DELETE CASCADE,
  FOREIGN KEY (idkorisnik) REFERENCES KORISNIK(idkorisnik) ON DELETE CASCADE,
  FOREIGN KEY (odgovaraidkomentar) REFERENCES KOMENTAR(idkomentar) ON DELETE SET NULL
);

CREATE TABLE fotoKomentar
(
  idkomentar BIGINT NOT NULL,
  fotoid BIGINT NOT NULL,
  PRIMARY KEY (idkomentar, fotoid),
  FOREIGN KEY (idkomentar) REFERENCES KOMENTAR(idkomentar) ON DELETE CASCADE,
  FOREIGN KEY (fotoid) REFERENCES FOTOGRAFIJA(fotoid) ON DELETE CASCADE
);