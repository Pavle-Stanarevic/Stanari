package com.clayplay.service;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.Korisnik;
import com.clayplay.model.Polaznik;
import com.clayplay.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceRegisterPolaznikTest {

    @Mock KorisnikRepository korisnikRepository;
    @Mock OrganizatorRepository organizatorRepository;
    @Mock PolaznikRepository polaznikRepository;
    @Mock AdministratorRepository administratorRepository;
    @Mock FotografijaRepository fotografijaRepository;
    @Mock PlacaRepository placaRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock FileStorageService fileStorageService;

    @Test
    void UserService_RegisterPolaznik_SavesKorisnikAndPolaznik() {
        UserService userService = new UserService(
                korisnikRepository,
                organizatorRepository,
                polaznikRepository,
                administratorRepository,
                fotografijaRepository,
                placaRepository,
                passwordEncoder,
                fileStorageService
        );

        RegistrationRequest req = new RegistrationRequest();
        req.firstName = "Ana";
        req.lastName = "Ivić";
        req.address = "Ulica 1";
        req.contact = "0912345678";
        req.email = "ana.ivic@example.com";
        req.password = "Test123";
        req.confirmPassword = "Test123";
        req.userType = "polaznik";

        when(korisnikRepository.findByEmail(req.email)).thenReturn(Optional.empty());
        when(korisnikRepository.existsByBrojTelefona(req.contact)).thenReturn(false);
        when(passwordEncoder.encode(req.password)).thenReturn("hashed");

        when(korisnikRepository.save(ArgumentMatchers.any(Korisnik.class))).thenAnswer(inv -> {
            Korisnik k = inv.getArgument(0);
            k.setIdKorisnik(1L);
            return k;
        });

        when(polaznikRepository.save(ArgumentMatchers.any(Polaznik.class))).thenAnswer(inv -> inv.getArgument(0));

        Korisnik saved = userService.register(req);

        assertNotNull(saved, "register mora vratiti Korisnik objekt");
        assertEquals(1L, saved.getIdKorisnik(), "Očekuje se postavljen ID nakon save()");

        verify(korisnikRepository, times(1)).save(any(Korisnik.class));
        verify(polaznikRepository, times(1)).save(any(Polaznik.class));
        verify(organizatorRepository, never()).save(any());
        verify(fotografijaRepository, never()).save(any());
        verify(fileStorageService, never()).save(any(), any());
    }
}
