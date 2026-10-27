package com.greentrack.backend.repository;

import com.greentrack.backend.model.Invoice;
import com.greentrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByUserOrderByUploadedAtDesc(User user);
}
