BEGIN TRANSACTION;

CREATE OR REPLACE FUNCTION rezervacija_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statusRez = 'canceled' AND OLD.statusRez <> 'canceled' THEN
       IF CURRENT_TIMESTAMP <= (SELECT datVrRadionica - INTERVAL '48 hours' 
                                      FROM RADIONICA 
                                      WHERE idRadionica = NEW.idRadionica) THEN
           RETURN NEW;
       ELSE
           RAISE EXCEPTION 'Rezervaciju nije moguće otkazati manje od 2 dana prije početka radionice.';
       END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_rezervacija_cancel
BEFORE UPDATE OF statusRez ON REZERVACIJA
FOR EACH ROW
EXECUTE FUNCTION rezervacija_cancel();


CREATE OR REPLACE FUNCTION broj_slobodnih_mjesta()
RETURNS TRIGGER AS $$
DECLARE
    brSlob INT;
BEGIN
    SELECT brSlobMjesta INTO brSlob
    FROM RADIONICA
    WHERE idRadionica = NEW.idRadionica
    FOR UPDATE;

    IF TG_OP = 'INSERT' THEN
        IF brSlob > 0 THEN
            UPDATE RADIONICA
            SET brSlobMjesta = brSlobMjesta - 1
            WHERE idRadionica = NEW.idRadionica;
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Nema slobodnih mjesta za ovu radionicu.';
        END IF;
    
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.statusRez = 'canceled' AND OLD.statusRez <> 'canceled' THEN
            UPDATE RADIONICA
            SET brSlobMjesta = brSlobMjesta + 1
            WHERE idRadionica = NEW.idRadionica;
            RETURN NEW;

        ELSIF NEW.statusRez = 'reserved' AND OLD.statusRez <> 'reserved' THEN
            IF brSlob > 0 THEN
                UPDATE RADIONICA
                SET brSlobMjesta = brSlobMjesta - 1
                WHERE idRadionica = NEW.idRadionica;
                RETURN NEW;
            ELSE
                RAISE EXCEPTION 'Nema slobodnih mjesta za ovu radionicu.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_broj_slobodnih_mjesta
BEFORE INSERT OR UPDATE OF statusRez ON REZERVACIJA
FOR EACH ROW
EXECUTE FUNCTION broj_slobodnih_mjesta();


CREATE OR REPLACE FUNCTION polaznik_obavezni_podaci()
RETURNS TRIGGER AS $$
DECLARE
    v_ime VARCHAR(50);
    v_prezime VARCHAR(50);
BEGIN
    SELECT k.ime, k.prezime
    INTO v_ime, v_prezime
    FROM KORISNIK k
    WHERE k.idKorisnik = NEW.idKorisnik;

    IF v_ime IS NULL OR v_prezime IS NULL THEN
        RAISE EXCEPTION 'Polaznik mora imati unijeta ime i prezime prije rezervacije radionice.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_polaznik_obavezni_podaci
BEFORE INSERT OR UPDATE ON POLAZNIK
FOR EACH ROW
EXECUTE FUNCTION polaznik_obavezni_podaci();


CREATE OR REPLACE FUNCTION organizator_obavezni_podaci()
RETURNS TRIGGER AS $$
DECLARE
    v_ime VARCHAR(50);
    v_prezime VARCHAR(50);
    v_adresa VARCHAR(100);
    v_brojTelefona VARCHAR(15);
    v_fotoId BIGINT;
BEGIN
    SELECT k.ime, k.prezime, k.adresa, k.brojTelefona, k.fotoId
    INTO v_ime, v_prezime, v_adresa, v_brojTelefona, v_fotoId
    FROM KORISNIK k
    WHERE k.idKorisnik = NEW.idKorisnik;

    IF v_adresa IS NULL OR v_brojTelefona IS NULL OR v_fotoId IS NULL THEN
        RAISE EXCEPTION 'Organizator mora imati unijeta adresu, broj telefona i fotografiju prije kreiranja radionice.';
    ELSIF NEW.imeStudija IS NULL AND (v_ime IS NULL OR v_prezime IS NULL) THEN
        RAISE EXCEPTION 'Organizator mora imati unijeta ime i prezime ili ime studija prije kreiranja radionice.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_organizator_obavezni_podaci
BEFORE INSERT OR UPDATE ON ORGANIZATOR
FOR EACH ROW
EXECUTE FUNCTION organizator_obavezni_podaci();


CREATE OR REPLACE FUNCTION korisnik_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.idKorisnik IN (SELECT idKorisnik FROM POLAZNIK) THEN
        IF NEW.ime IS NULL OR NEW.prezime IS NULL THEN
            RAISE EXCEPTION 'Polaznik mora imati unijeta ime i prezime prije rezervacije radionice.';
        END IF;

    ELSIF NEW.idKorisnik IN (SELECT idKorisnik FROM ORGANIZATOR) THEN
        IF NEW.adresa IS NULL OR NEW.brojTelefona IS NULL OR NEW.fotoId IS NULL THEN
            RAISE EXCEPTION 'Organizator mora imati unijeta adresu, broj telefona i fotografiju prije kreiranja radionice.';
        ELSIF (
            SELECT o.imeStudija FROM ORGANIZATOR o WHERE o.idKorisnik = NEW.idKorisnik
        ) IS NULL AND (NEW.ime IS NULL OR NEW.prezime IS NULL) THEN
            RAISE EXCEPTION 'Organizator mora imati unijeta ime i prezime ili ime studija prije kreiranja radionice.';
        END IF;
    END IF;

    RETURN NEW;    
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_korisnik_update
BEFORE UPDATE ON KORISNIK
FOR EACH ROW
EXECUTE FUNCTION korisnik_update();

COMMIT;
