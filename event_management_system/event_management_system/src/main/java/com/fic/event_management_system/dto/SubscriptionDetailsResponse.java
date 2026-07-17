package com.fic.event_management_system.dto;

import com.fic.event_management_system.entity.PortalSubscription;
import com.fic.event_management_system.entity.SubscriptionPlan;
import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.SubscriptionPlanCode;
import com.fic.event_management_system.enums.SubscriptionStatus;

import java.time.Duration;
import java.time.LocalDateTime;

public class SubscriptionDetailsResponse {

    private Long subscriptionId;
    private Long portalId;
    private String portalName;
    private String portalCode;
    private String ownerName;
    private String ownerEmail;

    private SubscriptionPlanCode planCode;
    private String planName;
    private SubscriptionPlanCode nextPlanCode;
    private String nextPlanName;

    private SubscriptionStatus status;
    private BillingCycle billingCycle;
    private BillingCycle nextBillingCycle;
    private LocalDateTime nextPlanStartsAt;

    private Boolean trial;
    private Boolean autoRenew;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Long daysRemaining;

    private Integer maxActiveEvents;
    private Integer maxPortalUsers;
    private Integer maxRegistrationsPerEvent;
    private Integer maxTicketClassesPerEvent;
    private Integer maxOrganizers;

    private Boolean customBranding;
    private Boolean advancedReports;
    private Boolean whiteLabel;
    private Boolean prioritySupport;

    public static SubscriptionDetailsResponse from(
            PortalSubscription subscription
    ) {
        if (subscription == null) {
            return null;
        }

        SubscriptionPlan plan = subscription.getPlan();

        SubscriptionDetailsResponse response =
                new SubscriptionDetailsResponse();

        response.subscriptionId = subscription.getId();

        if (subscription.getPortal() != null) {
            response.portalId = subscription.getPortal().getId();
            response.portalName = subscription.getPortal().getPortalName();
            response.portalCode = subscription.getPortal().getPortalCode();

            if (subscription.getPortal().getAdmin() != null) {
                String firstName = subscription.getPortal().getAdmin().getFirstName() == null
                        ? ""
                        : subscription.getPortal().getAdmin().getFirstName().trim();
                String lastName = subscription.getPortal().getAdmin().getLastName() == null
                        ? ""
                        : subscription.getPortal().getAdmin().getLastName().trim();
                String fullName = (firstName + " " + lastName).trim();

                response.ownerEmail = subscription.getPortal().getAdmin().getEmail();
                response.ownerName = fullName.isBlank()
                        ? response.ownerEmail
                        : fullName;
            }
        }

        if (plan != null) {
            response.planCode = plan.getCode();
            response.planName = plan.getDisplayName();

            response.maxActiveEvents = plan.getMaxActiveEvents();
            response.maxPortalUsers = plan.getMaxPortalUsers();
            response.maxRegistrationsPerEvent =
                    plan.getMaxRegistrationsPerEvent();
            response.maxTicketClassesPerEvent =
                    plan.getMaxTicketClassesPerEvent();
            response.maxOrganizers = plan.getMaxOrganizers();

            response.customBranding = plan.getCustomBranding();
            response.advancedReports = plan.getAdvancedReports();
            response.whiteLabel = plan.getWhiteLabel();
            response.prioritySupport = plan.getPrioritySupport();
        }

        if (subscription.getNextPlan() != null) {
            response.nextPlanCode = subscription.getNextPlan().getCode();
            response.nextPlanName = subscription.getNextPlan().getDisplayName();
            response.nextBillingCycle = subscription.getNextBillingCycle();
            response.nextPlanStartsAt = subscription.getNextPlanStartsAt();
        }

        response.status = subscription.getStatus();
        response.billingCycle = subscription.getBillingCycle();
        response.trial = subscription.getTrial();
        response.autoRenew = subscription.getAutoRenew();
        response.startDate = subscription.getStartDate();
        response.endDate = subscription.getEndDate();

        if (subscription.getEndDate() != null) {
            long remaining = Duration.between(
                    LocalDateTime.now(),
                    subscription.getEndDate()
            ).toDays();

            response.daysRemaining = Math.max(remaining, 0);
        }

        return response;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public Long getPortalId() {
        return portalId;
    }

    public String getPortalName() {
        return portalName;
    }

    public String getPortalCode() {
        return portalCode;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public SubscriptionPlanCode getPlanCode() {
        return planCode;
    }

    public String getPlanName() {
        return planName;
    }

    public SubscriptionPlanCode getNextPlanCode() {
        return nextPlanCode;
    }

    public String getNextPlanName() {
        return nextPlanName;
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public BillingCycle getBillingCycle() {
        return billingCycle;
    }

    public BillingCycle getNextBillingCycle() {
        return nextBillingCycle;
    }

    public LocalDateTime getNextPlanStartsAt() {
        return nextPlanStartsAt;
    }

    public Boolean getTrial() {
        return trial;
    }

    public Boolean getAutoRenew() {
        return autoRenew;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public Long getDaysRemaining() {
        return daysRemaining;
    }

    public Integer getMaxActiveEvents() {
        return maxActiveEvents;
    }

    public Integer getMaxPortalUsers() {
        return maxPortalUsers;
    }

    public Integer getMaxRegistrationsPerEvent() {
        return maxRegistrationsPerEvent;
    }

    public Integer getMaxTicketClassesPerEvent() {
        return maxTicketClassesPerEvent;
    }

    public Integer getMaxOrganizers() {
        return maxOrganizers;
    }

    public Boolean getCustomBranding() {
        return customBranding;
    }

    public Boolean getAdvancedReports() {
        return advancedReports;
    }

    public Boolean getWhiteLabel() {
        return whiteLabel;
    }

    public Boolean getPrioritySupport() {
        return prioritySupport;
    }
}
