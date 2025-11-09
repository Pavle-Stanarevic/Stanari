INSERT INTO KORISNIK (email, password)
VALUES ('admin1@progi.hr', '$2b$10$f6t6.W6JTmvsXhgO2HPu1.pY2NA64BsWTPI973hj7/hU4GMwecmme'); --password: admin1

INSERT INTO KORISNIK (email, password)
VALUES ('admin2@progi.hr', '$2b$10$3cJzHtMMGd7Jg6IuC37Hx.5W.Z4rQvcRjAeikLtleFQB4RZ5xUIFi'); --password: admin2

INSERT INTO ADMINISTRATOR (idKorisnik)
SELECT idKorisnik FROM KORISNIK WHERE email = 'admin1@progi.hr';

INSERT INTO ADMINISTRATOR (idKorisnik)
SELECT idKorisnik FROM KORISNIK WHERE email = 'admin2@progi.hr';