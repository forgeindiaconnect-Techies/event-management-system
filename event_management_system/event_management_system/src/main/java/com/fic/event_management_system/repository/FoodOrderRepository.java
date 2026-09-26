package com.fic.event_management_system.repository;

import com.fic.event_management_system.entity.FoodOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {
    List<FoodOrder> findByTheaterId(Long theaterId);
    List<FoodOrder> findByTheaterIdAndOrderStatus(Long theaterId, String orderStatus);
    List<FoodOrder> findByTheaterIdAndOrderStatusIn(Long theaterId, List<String> statuses);
    List<FoodOrder> findByTheaterIdAndOrderTimeBetween(Long theaterId, LocalDateTime start, LocalDateTime end);
}
