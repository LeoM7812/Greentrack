package com.greentrack.backend.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.greentrack.backend.model.Invoice;
import com.greentrack.backend.model.User;

/** Each user sees only their own bills, newest first. */
@DataJpaTest
@ActiveProfiles("test")
class InvoiceRepositoryTest {

    @Autowired UserRepository users;
    @Autowired InvoiceRepository invoices;

    private User user(String email) {
        User u = new User();
        u.setEmail(email);
        u.setName(email);
        u.setPassword("x");
        return users.save(u);
    }

    private void bill(User user, String period, int daysAgo) {
        Invoice i = new Invoice();
        i.setUser(user);
        i.setPeriod(period);
        i.setUploadedAt(LocalDateTime.now().minusDays(daysAgo));
        invoices.save(i);
    }

    @Test
    void returnsOnlyTheUsersBillsNewestFirst() {
        User ana = user("ana@example.pt");
        User rui = user("rui@example.pt");
        bill(ana, "Janeiro", 40);
        bill(rui, "Janeiro", 35);
        bill(ana, "Fevereiro", 5);

        List<String> periods = invoices.findByUserOrderByUploadedAtDesc(ana).stream().map(Invoice::getPeriod).toList();

        assertEquals(List.of("Fevereiro", "Janeiro"), periods);
    }
}
