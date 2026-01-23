package com.clayplay.service;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.model.Korisnik;
import com.clayplay.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceRegisterDuplicateEmailTest {

    @Mock KorisnikRepository korisnikRepository;
    @Mock OrganizatorRepository organizatorRepository;
    @Mock PolaznikRepository polaznikRepository;
    @Mock AdministratorRepository administratorRepository;
    @Mock FotografijaRepository fotografijaRepository;
    @Mock PlacaRepository placaRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock FileStorageService fileStorageService;

    @Test
    void UserService_Register_WhenEmailExists_ThrowsException() {
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
        req.contact = "0912345678";
        req.email = "ana.ivic@example.com";
        req.password = "Test123";
        req.confirmPassword = "Test123";
        req.userType = "polaznik";

        when(korisnikRepository.findByEmail(req.email)).thenReturn(Optional.of(new Korisnik()));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userService.register(req),
                "Očekuje se IllegalArgumentException kad email već postoji"
        );

        assertEquals("Email already registered", ex.getMessage());

        verify(korisnikRepository, never()).save(any());
        verify(polaznikRepository, never()).save(any());
        verify(organizatorRepository, never()).save(any());
    }
}
