package com.greentrack.backend.dto;

import com.greentrack.backend.model.Invoice;

/** What the app's bill history shows. */
public record InvoiceSummary(Long id, String period, double consumptionKwh, double totalAmount,
                             String tariffType, String uploadedAt) {
    public static InvoiceSummary of(Invoice invoice) {
        return new InvoiceSummary(invoice.getId(), invoice.getPeriod(), invoice.getConsumptionKwh(),
                invoice.getTotalAmount(), invoice.getTariffType(), invoice.getUploadedAt().toString());
    }
}
