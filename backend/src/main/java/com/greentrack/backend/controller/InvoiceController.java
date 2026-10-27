package com.greentrack.backend.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.greentrack.backend.dto.Comparison;
import com.greentrack.backend.dto.InvoiceSummary;
import com.greentrack.backend.dto.SuggestionsDTO;
import com.greentrack.backend.model.Invoice;
import com.greentrack.backend.model.User;
import com.greentrack.backend.repository.InvoiceRepository;
import com.greentrack.backend.service.InvoiceService;

import java.time.LocalDateTime;
import java.util.List;




@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;

    public InvoiceController(InvoiceService invoiceService, InvoiceRepository invoiceRepository) {
        this.invoiceService = invoiceService;
        this.invoiceRepository = invoiceRepository;
    }

    /** The user's own bills, newest first. */
    @GetMapping
    public List<InvoiceSummary> list(@AuthenticationPrincipal User user) {
        return invoiceRepository.findByUserOrderByUploadedAtDesc(user).stream().map(InvoiceSummary::of).toList();
    }

    @PostMapping("/upload")
    public ResponseEntity<SuggestionsDTO> uploadInvoice(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal User user) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            return toResponse(saved(invoiceService.processInvoice(file), user));
        } catch (Exception e) {
            System.err.println("Erro no upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/upload-test")
    public ResponseEntity<SuggestionsDTO> uploadTest(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal User user) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            return toResponse(saved(invoiceService.processInvoice(file), user));
        } catch (Exception e) {
            System.err.println("❌ Erro no upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** Keeps the figures of every successful analysis, so the history shows real bills. */
    private SuggestionsDTO saved(SuggestionsDTO result, User user) {
        if (result == null || user == null || !"success".equals(result.getProcessingStatus())) {
            return result;
        }
        invoiceRepository.findByUserOrderByUploadedAtDesc(user).stream().findFirst()
                .ifPresent(previous -> result.setComparisonPreviousMonth(new Comparison(
                        percentChange(previous.getConsumptionKwh(), result.getConsumptionKwh()),
                        percentChange(previous.getTotalAmount(), result.getTotalAmount()))));
        Invoice invoice = new Invoice();
        invoice.setUser(user);
        invoice.setPeriod(result.getPeriod());
        invoice.setConsumptionKwh(result.getConsumptionKwh());
        invoice.setTotalAmount(result.getTotalAmount());
        invoice.setAverageDaily(result.getAverageDaily());
        invoice.setTariffType(result.getTariffType());
        invoice.setContractedPower(result.getContractedPower());
        invoice.setUploadedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);
        return result;
    }

    /** Percent change from before to now, one decimal; null when there's nothing to compare. */
    static Double percentChange(double before, double now) {
        if (before <= 0) {
            return null;
        }
        return Math.round((now - before) / before * 1000) / 10.0;
    }

    /**
     * A failed analysis is an error for the client, never a 200 with placeholder data.
     * Readability warnings stay 200 so the app can show the tips.
     */
    private ResponseEntity<SuggestionsDTO> toResponse(SuggestionsDTO result) {
        if (result == null || result.analysisFailed()) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(result);
        }
        return ResponseEntity.ok(result);
    }
}
