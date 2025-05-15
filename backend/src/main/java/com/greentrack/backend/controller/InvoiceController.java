package com.greentrack.backend.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.greentrack.backend.dto.SuggestionsDTO;
import com.greentrack.backend.service.InvoiceService;



@RestController
@RequestMapping("/api/invoice")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping("/upload")
    public ResponseEntity<SuggestionsDTO> uploadInvoice(@RequestParam("file") MultipartFile file) {
        try {
            SuggestionsDTO suggestions = invoiceService.processInvoice(file);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
           return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

