package com.greentrack.backend.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.greentrack.backend.dto.SuggestionsDTO;
import com.greentrack.backend.service.InvoiceService;




@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping("/upload")
    public ResponseEntity<SuggestionsDTO> uploadInvoice(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            return toResponse(invoiceService.processInvoice(file));
        } catch (Exception e) {
            System.err.println("Erro no upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/upload-test")
    public ResponseEntity<SuggestionsDTO> uploadTest(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            return toResponse(invoiceService.processInvoice(file));
        } catch (Exception e) {
            System.err.println("❌ Erro no upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
