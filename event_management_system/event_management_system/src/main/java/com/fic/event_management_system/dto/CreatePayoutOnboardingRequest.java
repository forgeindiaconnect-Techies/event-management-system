package com.fic.event_management_system.dto;

import com.fic.event_management_system.enums.GatewayProvider;

public record CreatePayoutOnboardingRequest(
        GatewayProvider gatewayProvider
) {
}
