package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.*;
import com.fic.event_management_system.service.PortalPayoutAccountService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portal/payout-account/development")
@ConditionalOnProperty(
        name = "payout.gateway.mode",
        havingValue = "development",
        matchIfMissing = true
)
public class DevelopmentPayoutController {

    private final PortalPayoutAccountService payoutService;

    public DevelopmentPayoutController(
            PortalPayoutAccountService payoutService) {
        this.payoutService = payoutService;
    }

    @PostMapping("/details")
    public PayoutAccountResponse submitDetails(
            @RequestBody DevelopmentPayoutRequest request) {

        return payoutService
                .submitDevelopmentDetails(request);
    }

    @PatchMapping("/verification")
    public PayoutAccountResponse updateVerification(
            @RequestBody
            DevelopmentPayoutStatusRequest request) {

        return payoutService
                .updateDevelopmentStatus(request);
    }
}
