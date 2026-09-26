package com.fic.event_management_system.dto;

import java.util.List;

public class SuperAdminTheaterDashboardResponse {
    private long activeTheaters;
    private long totalTheaters;
    private double totalRevenue;
    private long totalTicketsSold;
    private long totalMoviesListed;
    private List<MonthlyRevenueDTO> revenueChartData;

    public long getActiveTheaters() { return activeTheaters; }
    public void setActiveTheaters(long activeTheaters) { this.activeTheaters = activeTheaters; }

    public long getTotalTheaters() { return totalTheaters; }
    public void setTotalTheaters(long totalTheaters) { this.totalTheaters = totalTheaters; }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getTotalTicketsSold() { return totalTicketsSold; }
    public void setTotalTicketsSold(long totalTicketsSold) { this.totalTicketsSold = totalTicketsSold; }

    public long getTotalMoviesListed() { return totalMoviesListed; }
    public void setTotalMoviesListed(long totalMoviesListed) { this.totalMoviesListed = totalMoviesListed; }

    public List<MonthlyRevenueDTO> getRevenueChartData() { return revenueChartData; }
    public void setRevenueChartData(List<MonthlyRevenueDTO> revenueChartData) { this.revenueChartData = revenueChartData; }

    public static class MonthlyRevenueDTO {
        private String name;
        private double revenue;

        public MonthlyRevenueDTO(String name, double revenue) {
            this.name = name;
            this.revenue = revenue;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public double getRevenue() { return revenue; }
        public void setRevenue(double revenue) { this.revenue = revenue; }
    }
}
