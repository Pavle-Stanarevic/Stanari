BEGIN TRANSACTION;

CREATE OR REPLACE FUNCTION rezervacija_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statusrez = 'canceled' AND OLD.statusrez <> 'canceled' THEN
       IF CURRENT_TIMESTAMP <= (SELECT datvrradionica - INTERVAL '48 hours' 
                                      FROM RADIONICA 
                                      WHERE idradionica = NEW.idradionica) THEN
           RETURN NEW;
       ELSE
           RAISE EXCEPTION 'Rezervaciju nije moguće otkazati manje od 2 dana prije početka radionice.';
       END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_rezervacija_cancel
BEFORE UPDATE OF statusrez ON REZERVACIJA
FOR EACH ROW
EXECUTE FUNCTION rezervacija_cancel();


CREATE OR REPLACE FUNCTION broj_slobodnih_mjesta()
RETURNS TRIGGER AS $$
DECLARE
    br_slob INT;
BEGIN
    SELECT brslobmjesta INTO br_slob
    FROM RADIONICA
    WHERE idradionica = NEW.idradionica
    FOR UPDATE;

    IF TG_OP = 'INSERT' THEN
        IF br_slob > 0 THEN
            UPDATE RADIONICA
            SET brslobmjesta = brslobmjesta - 1
            WHERE idradionica = NEW.idradionica;
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Nema slobodnih mjesta za ovu radionicu.';
        END IF;
    
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.statusrez = 'canceled' AND OLD.statusrez <> 'canceled' THEN
            UPDATE RADIONICA
            SET brslobmjesta = brslobmjesta + 1
            WHERE idradionica = NEW.idradionica;
            RETURN NEW;

        ELSIF NEW.statusrez = 'reserved' AND OLD.statusrez <> 'reserved' THEN
            IF br_slob > 0 THEN
                UPDATE RADIONICA
                SET brslobmjesta = brslobmjesta - 1
                WHERE idradionica = NEW.idradionica;
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
BEFORE INSERT OR UPDATE OF statusrez ON REZERVACIJA
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
    WHERE k.idkorisnik = NEW.idkorisnik;

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
    v_brojtelefona VARCHAR(15);
    v_fotoid BIGINT;
BEGIN
    SELECT k.ime, k.prezime, k.adresa, k.brojtelefona, k.fotoid
    INTO v_ime, v_prezime, v_adresa, v_brojtelefona, v_fotoid
    FROM KORISNIK k
    WHERE k.idkorisnik = NEW.idkorisnik;

    IF v_adresa IS NULL OR v_brojtelefona IS NULL OR v_fotoid IS NULL THEN
        RAISE EXCEPTION 'Organizator mora imati unijeta adresu, broj telefona i fotografiju prije kreiranja radionice.';
    ELSIF NEW.imestudija IS NULL AND (v_ime IS NULL OR v_prezime IS NULL) THEN
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
    IF NEW.idkorisnik IN (SELECT idkorisnik FROM POLAZNIK) THEN
        IF NEW.ime IS NULL OR NEW.prezime IS NULL THEN
            RAISE EXCEPTION 'Polaznik mora imati unijeta ime i prezime prije rezervacije radionice.';
        END IF;

    ELSIF NEW.idkorisnik IN (SELECT idkorisnik FROM ORGANIZATOR) THEN
        IF NEW.adresa IS NULL OR NEW.brojtelefona IS NULL OR NEW.fotoid IS NULL THEN
            RAISE EXCEPTION 'Organizator mora imati unijeta adresu, broj telefona i fotografiju prije kreiranja radionice.';
        ELSIF (
            SELECT o.imestudija FROM ORGANIZATOR o WHERE o.idkorisnik = NEW.idkorisnik
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
