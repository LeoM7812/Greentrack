package com.greentrack.backend.dto;

/** Change versus the user's previous bill, in percent (positive = went up). */
public record Comparison(Double consumptionDifference, Double amountDifference) {
}
