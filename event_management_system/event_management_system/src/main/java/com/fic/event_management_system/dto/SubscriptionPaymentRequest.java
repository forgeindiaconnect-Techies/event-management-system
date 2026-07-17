package com.fic.event_management_system.dto;

import com.fic.event_management_system.enums.BillingCycle;
import com.fic.event_management_system.enums.SubscriptionPlanCode;

public class SubscriptionPaymentRequest {

    private SubscriptionPlanCode planCode;
    private BillingCycle billingCycle;

    public SubscriptionPlanCode getPlanCode() {
        return planCode;
    }

    public void setPlanCode(SubscriptionPlanCode planCode) {
        this.planCode = planCode;
    }

    public BillingCycle getBillingCycle() {
        return billingCycle;
    }

    public void setBillingCycle(BillingCycle billingCycle) {
        this.billingCycle = billingCycle;
    }
}
