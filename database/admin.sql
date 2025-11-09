INSERT INTO KORISNIK (email, password)
VALUES ('admin1@progi.hr', 'admin1');

INSERT INTO KORISNIK (email, password)
VALUES ('admin2@progi.hr', 'admin2');

INSERT INTO ADMINISTRATOR (idKorisnik)
SELECT idKorisnik FROM KORISNIK WHERE email = 'admin1@progi.hr';

INSERT INTO ADMINISTRATOR (idKorisnik)
SELECT idKorisnik FROM KORISNIK WHERE email = 'admin2@progi.hr';