package com.fic.event_management_system.dto;

import java.math.BigDecimal;
import java.util.List;

public class FoodOrderRequest {

    private Long theaterId;
    private String paymentMode;
    private String deliveryLocation;
    private BigDecimal totalAmount;
    private String source; // "COUNTER" or "SEAT"
    private List<OrderItemRequest> items;

    // Getters and Setters

    public Long getTheaterId() {
        return theaterId;
    }

    public void setTheaterId(Long theaterId) {
        this.theaterId = theaterId;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getDeliveryLocation() {
        return deliveryLocation;
    }

    public void setDeliveryLocation(String deliveryLocation) {
        this.deliveryLocation = deliveryLocation;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public static class OrderItemRequest {
        private Long menuItemId;
        private Integer quantity;
        private String modifiers;

        public Long getMenuItemId() {
            return menuItemId;
        }

        public void setMenuItemId(Long menuItemId) {
            this.menuItemId = menuItemId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getModifiers() {
            return modifiers;
        }

        public void setModifiers(String modifiers) {
            this.modifiers = modifiers;
        }
    }
}
