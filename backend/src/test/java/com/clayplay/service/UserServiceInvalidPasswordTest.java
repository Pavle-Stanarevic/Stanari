package com.clayplay.service;

import com.clayplay.dto.RegistrationRequest;
import com.clayplay.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceInvalidPasswordTest {

    @Mock KorisnikRepository korisnikRepository;
    @Mock OrganizatorRepository organizatorRepository;
    @Mock PolaznikRepository polaznikRepository;
    @Mock AdministratorRepository administratorRepository;
    @Mock FotografijaRepository fotografijaRepository;
    @Mock PlacaRepository placaRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock FileStorageService fileStorageService;

    @Test
    void UserService_Register_InvalidPasswordMissingUppercase_ThrowsException() {
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
        req.password = "test123";
        req.confirmPassword = "test123";
        req.userType = "polaznik";

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userService.register(req)
        );

        assertEquals("Password must contain at least one uppercase letter", ex.getMessage());

        verifyNoInteractions(korisnikRepository);
        verifyNoInteractions(polaznikRepository);
        verifyNoInteractions(organizatorRepository);
    }
}
