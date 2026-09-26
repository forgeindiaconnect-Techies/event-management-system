package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.FoodOrderRequest;
import com.fic.event_management_system.entity.FoodOrder;
import com.fic.event_management_system.entity.MenuItem;
import com.fic.event_management_system.entity.OrderItem;
import com.fic.event_management_system.entity.Theater;
import com.fic.event_management_system.repository.FoodOrderRepository;
import com.fic.event_management_system.repository.MenuItemRepository;
import com.fic.event_management_system.repository.TheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fb")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@SuppressWarnings("null")
public class FoodAndBeverageController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private FoodOrderRepository foodOrderRepository;

    @Autowired
    private TheaterRepository theaterRepository;

    // ==========================================
    // MENU MANAGEMENT (For Owner/Manager)
    // ==========================================

    @GetMapping("/menu/{theaterId}")
    public ResponseEntity<List<MenuItem>> getMenu(@PathVariable Long theaterId, @RequestParam(required = false) Boolean availableOnly) {
        if (Boolean.TRUE.equals(availableOnly)) {
            return ResponseEntity.ok(menuItemRepository.findByTheaterIdAndIsAvailableTrue(theaterId));
        }
        return ResponseEntity.ok(menuItemRepository.findByTheaterId(theaterId));
    }

    @PostMapping("/menu")
    public ResponseEntity<?> createMenuItem(@RequestBody MenuItem menuItem) {
        Optional<Theater> theaterOpt = theaterRepository.findById(menuItem.getTheater().getId());
        if (theaterOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Theater not found"));
        }
        menuItem.setTheater(theaterOpt.get());
        if (menuItem.getOptions() != null) {
            menuItem.getOptions().forEach(opt -> opt.setMenuItem(menuItem));
        }
        return ResponseEntity.ok(menuItemRepository.save(menuItem));
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<?> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem updatedItem) {
        Optional<MenuItem> existingOpt = menuItemRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        MenuItem existing = existingOpt.get();
        existing.setName(updatedItem.getName());
        existing.setCategory(updatedItem.getCategory());
        existing.setPrice(updatedItem.getPrice());
        existing.setImageUrl(updatedItem.getImageUrl());
        existing.setDescription(updatedItem.getDescription());
        existing.setAvailable(updatedItem.isAvailable());
        existing.setStockLevel(updatedItem.getStockLevel());
        
        existing.getOptions().clear();
        if (updatedItem.getOptions() != null) {
            updatedItem.getOptions().forEach(opt -> {
                opt.setMenuItem(existing);
                existing.getOptions().add(opt);
            });
        }
        
        return ResponseEntity.ok(menuItemRepository.save(existing));
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // ORDER MANAGEMENT (For F&B Staff / Public)
    // ==========================================

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody FoodOrderRequest request) {
        Optional<Theater> theaterOpt = theaterRepository.findById(request.getTheaterId());
        if (theaterOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Theater not found"));
        }

        FoodOrder order = new FoodOrder();
        order.setTheater(theaterOpt.get());
        order.setOrderTime(LocalDateTime.now());
        // Counter (quick-serve) orders are instantly delivered. Only SEAT orders go through kitchen flow.
        boolean isCounter = "COUNTER".equalsIgnoreCase(request.getSource()) || request.getSource() == null;
        order.setOrderStatus(isCounter ? "DELIVERED" : "PENDING");
        order.setPaymentMode(request.getPaymentMode());
        order.setDeliveryLocation(request.getDeliveryLocation());
        order.setTotalAmount(request.getTotalAmount());

        List<OrderItem> orderItems = request.getItems().stream().map(reqItem -> {
            OrderItem item = new OrderItem();
            item.setFoodOrder(order);
            item.setQuantity(reqItem.getQuantity());
            item.setModifiers(reqItem.getModifiers());
            MenuItem menuItem = menuItemRepository.findById(reqItem.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu Item not found"));
            item.setMenuItem(menuItem);
            return item;
        }).collect(Collectors.toList());

        order.setOrderItems(orderItems);
        return ResponseEntity.ok(foodOrderRepository.save(order));
    }

    @GetMapping("/orders/{theaterId}")
    public ResponseEntity<List<FoodOrder>> getActiveOrders(@PathVariable Long theaterId) {
        // Only return orders that are PENDING or PREPARING for the kitchen view
        List<String> activeStatuses = List.of("PENDING", "PREPARING", "READY");
        return ResponseEntity.ok(foodOrderRepository.findByTheaterIdAndOrderStatusIn(theaterId, activeStatuses));
    }

    @DeleteMapping("/orders/clear")
    @jakarta.transaction.Transactional
    public ResponseEntity<?> clearAllOrders() {
        foodOrderRepository.deleteAll();
        return ResponseEntity.ok().build();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<FoodOrder> existingOpt = foodOrderRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        FoodOrder existing = existingOpt.get();
        existing.setOrderStatus(body.get("status"));
        return ResponseEntity.ok(foodOrderRepository.save(existing));
    }

    // ==========================================
    // SALES SUMMARY (For Manager / Staff Reports)
    // ==========================================

    @GetMapping("/sales/today/{theaterId}")
    public ResponseEntity<Map<String, Object>> getTodaySales(@PathVariable Long theaterId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        List<FoodOrder> todayOrders = foodOrderRepository
                .findByTheaterIdAndOrderTimeBetween(theaterId, startOfDay, now);

        BigDecimal totalRevenue = todayOrders.stream()
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> byPayment = todayOrders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getPaymentMode() != null ? o.getPaymentMode() : "UNKNOWN",
                        Collectors.counting()));

        // Top selling item
        Map<String, Long> itemCounts = new HashMap<>();
        for (FoodOrder order : todayOrders) {
            if (order.getOrderItems() != null) {
                for (OrderItem oi : order.getOrderItems()) {
                    String name = oi.getMenuItem() != null ? oi.getMenuItem().getName() : "Unknown";
                    itemCounts.merge(name, (long) oi.getQuantity(), Long::sum);
                }
            }
        }
        String topItem = itemCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("—");

        List<Map<String, Object>> orderDetails = todayOrders.stream().map(order -> {
            Map<String, Object> om = new HashMap<>();
            om.put("id", order.getId());
            om.put("orderStatus", order.getOrderStatus());
            om.put("totalAmount", order.getTotalAmount());
            om.put("paymentMode", order.getPaymentMode());
            om.put("deliveryLocation", order.getDeliveryLocation());
            om.put("orderTime", order.getOrderTime());
            List<Map<String, Object>> items = new java.util.ArrayList<>();
            if (order.getOrderItems() != null) {
                for (OrderItem oi : order.getOrderItems()) {
                    Map<String, Object> im = new HashMap<>();
                    im.put("quantity", oi.getQuantity());
                    im.put("modifiers", oi.getModifiers());
                    if (oi.getMenuItem() != null) {
                        im.put("id", oi.getMenuItem().getId());
                        im.put("name", oi.getMenuItem().getName());
                        im.put("category", oi.getMenuItem().getCategory());
                        im.put("price", oi.getMenuItem().getPrice());
                    }
                    items.add(im);
                }
            }
            om.put("items", items);
            return om;
        }).collect(Collectors.toList());

        // Sort latest orders first
        Collections.reverse(orderDetails);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRevenue", totalRevenue);
        summary.put("orderCount", todayOrders.size());
        summary.put("byPaymentMode", byPayment);
        summary.put("topItem", topItem);
        summary.put("orders", orderDetails);

        return ResponseEntity.ok(summary);
    }
}
