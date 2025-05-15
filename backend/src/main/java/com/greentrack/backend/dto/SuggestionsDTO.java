package com.greentrack.backend.dto;

import java.util.List;

public class SuggestionsDTO {

    private double averageConsumption;
    private List<String> suggestions;

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
}
