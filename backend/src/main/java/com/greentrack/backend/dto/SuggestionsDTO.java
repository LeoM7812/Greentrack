package com.greentrack.backend.dto;

import java.util.List;

public class SuggestionsDTO {

    private double averageConsumption;
    private List<String> suggestions;
    
    // Novos campos para análise detalhada
    private String period;
    private double consumptionKwh;
    private double totalAmount;
    private double averageDaily;
    private String tariffType;
    private double contractedPower;
    private String uploadDate;
    private String processingStatus;
    private String readabilityCheck; // Nova propriedade para verificação de legibilidade

    // Getters and Setters

    public double getAverageConsumption() {
        return averageConsumption;
    }

    public void setAverageConsumption(double averageConsumption) {
        this.averageConsumption = averageConsumption;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public double getConsumptionKwh() {
        return consumptionKwh;
    }

    public void setConsumptionKwh(double consumptionKwh) {
        this.consumptionKwh = consumptionKwh;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public double getAverageDaily() {
        return averageDaily;
    }

    public void setAverageDaily(double averageDaily) {
        this.averageDaily = averageDaily;
    }

    public String getTariffType() {
        return tariffType;
    }

    public void setTariffType(String tariffType) {
        this.tariffType = tariffType;
    }

    public double getContractedPower() {
        return contractedPower;
    }

    public void setContractedPower(double contractedPower) {
        this.contractedPower = contractedPower;
    }

    public String getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(String uploadDate) {
        this.uploadDate = uploadDate;
    }

    public String getProcessingStatus() {
        return processingStatus;
    }

    public void setProcessingStatus(String processingStatus) {
        this.processingStatus = processingStatus;
    }

    public String getReadabilityCheck() {
        return readabilityCheck;
    }

    public void setReadabilityCheck(String readabilityCheck) {
        this.readabilityCheck = readabilityCheck;
    }
}
