package com.fic.event_management_system.config;

import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.repository.SubscriptionPlanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class SubscriptionPlanSeeder implements CommandLineRunner {

    private final SubscriptionPlanRepository planRepository;

    public SubscriptionPlanSeeder(
            SubscriptionPlanRepository planRepository
    ) {
        this.planRepository = planRepository;
    }

    @Override
    public void run(String... args) {
        createStandardPlan();
        createProfessionalPlan();
        createEnterprisePlan();
        updateCustomerFacingPlanNames();
    }

    private void updateCustomerFacingPlanNames() {
        planRepository.findByCode(SubscriptionPlanCode.PROFESSIONAL)
                .ifPresent(plan -> {
                    plan.setDisplayName("Pro");
                    planRepository.save(plan);
                });
        planRepository.findByCode(SubscriptionPlanCode.ENTERPRISE)
                .ifPresent(plan -> {
                    plan.setDisplayName("ProMax");
                    planRepository.save(plan);
                });
    }

    private void createStandardPlan() {
        if (planRepository.findByCode(
                SubscriptionPlanCode.STANDARD
        ).isPresent()) {
            return;
        }

        SubscriptionPlan plan = new SubscriptionPlan();

        plan.setCode(SubscriptionPlanCode.STANDARD);
        plan.setDisplayName("Standard");
        plan.setDescription(
                "Essential tools for small events and growing teams."
        );

        // Replace these example prices if required.
        plan.setMonthlyPrice(new BigDecimal("999.00"));
        plan.setYearlyPrice(new BigDecimal("9999.00"));

        plan.setMaxActiveEvents(3);
        plan.setMaxPortalUsers(10);
        plan.setMaxRegistrationsPerEvent(500);
        plan.setMaxTicketClassesPerEvent(3);
        plan.setMaxStaffInvitations(10);
        plan.setMaxSpeakersPerEvent(20);
        plan.setMaxExhibitorsPerEvent(10);
        plan.setMaxCustomRegistrationFields(10);
        plan.setMaxOrganizers(2);

        plan.setCustomBranding(false);
        plan.setAdvancedReports(false);
        plan.setWhiteLabel(false);
        plan.setPrioritySupport(false);
        plan.setActive(true);

        planRepository.save(plan);
    }

    private void createProfessionalPlan() {
        if (planRepository.findByCode(
                SubscriptionPlanCode.PROFESSIONAL
        ).isPresent()) {
            return;
        }

        SubscriptionPlan plan = new SubscriptionPlan();

        plan.setCode(SubscriptionPlanCode.PROFESSIONAL);
        plan.setDisplayName("Pro");
        plan.setDescription(
                "Advanced event management for established organizations."
        );

        plan.setMonthlyPrice(new BigDecimal("2499.00"));
        plan.setYearlyPrice(new BigDecimal("24999.00"));

        plan.setMaxActiveEvents(15);
        plan.setMaxPortalUsers(50);
        plan.setMaxRegistrationsPerEvent(5000);
        plan.setMaxTicketClassesPerEvent(10);
        plan.setMaxStaffInvitations(50);
        plan.setMaxSpeakersPerEvent(100);
        plan.setMaxExhibitorsPerEvent(50);
        plan.setMaxCustomRegistrationFields(40);
        plan.setMaxOrganizers(10);

        plan.setCustomBranding(true);
        plan.setAdvancedReports(true);
        plan.setWhiteLabel(false);
        plan.setPrioritySupport(false);
        plan.setActive(true);

        planRepository.save(plan);
    }

    private void createEnterprisePlan() {
        if (planRepository.findByCode(
                SubscriptionPlanCode.ENTERPRISE
        ).isPresent()) {
            return;
        }

        SubscriptionPlan plan = new SubscriptionPlan();

        plan.setCode(SubscriptionPlanCode.ENTERPRISE);
        plan.setDisplayName("ProMax");
        plan.setDescription(
                "Unlimited platform access for large organizations."
        );

        plan.setMonthlyPrice(new BigDecimal("5999.00"));
        plan.setYearlyPrice(new BigDecimal("59999.00"));

        // -1 represents unlimited.
        plan.setMaxActiveEvents(-1);
        plan.setMaxPortalUsers(-1);
        plan.setMaxRegistrationsPerEvent(-1);
        plan.setMaxTicketClassesPerEvent(-1);
        plan.setMaxStaffInvitations(-1);
        plan.setMaxSpeakersPerEvent(-1);
        plan.setMaxExhibitorsPerEvent(-1);
        plan.setMaxCustomRegistrationFields(-1);
        plan.setMaxOrganizers(-1);

        plan.setCustomBranding(true);
        plan.setAdvancedReports(true);
        plan.setWhiteLabel(true);
        plan.setPrioritySupport(true);
        plan.setActive(true);

        planRepository.save(plan);
    }
}
