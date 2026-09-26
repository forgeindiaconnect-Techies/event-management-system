package com.fic.event_management_system.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // e.g., "Popcorn", "Beverage", "Combo", "Snack"

    @Column(nullable = false)
    private BigDecimal price;

    @Column(length = 1000)
    private String imageUrl;

    @com.fasterxml.jackson.annotation.JsonProperty("isAvailable")
    private boolean isAvailable = true;

    private Integer stockLevel; // null means unlimited stock

    @Column(length = 500)
    private String description;

    @ManyToOne
    @JoinColumn(name = "theater_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"portal", "adminUser"})
    private Theater theater;

    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private java.util.List<MenuItemOption> options = new java.util.ArrayList<>();

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    public void setAvailable(boolean available) {
        this.isAvailable = available;
    }

    public Integer getStockLevel() {
        return stockLevel;
    }

    public void setStockLevel(Integer stockLevel) {
        this.stockLevel = stockLevel;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Theater getTheater() {
        return theater;
    }

    public void setTheater(Theater theater) {
        this.theater = theater;
    }

    public java.util.List<MenuItemOption> getOptions() {
        return options;
    }

    public void setOptions(java.util.List<MenuItemOption> options) {
        this.options = options;
    }
}
