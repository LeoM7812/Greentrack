package com.greentrack.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** A bill the user uploaded and the AI read successfully. Only the figures, never the file. */
@Data
@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private User user;

    private String period;
    private double consumptionKwh;
    private double totalAmount;
    private double averageDaily;
    private String tariffType;
    private double contractedPower;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;
}
