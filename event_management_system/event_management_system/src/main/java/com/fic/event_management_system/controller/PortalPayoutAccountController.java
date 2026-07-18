package com.fic.event_management_system.controller;

import com.fic.event_management_system.dto.CreatePayoutOnboardingRequest;
import com.fic.event_management_system.dto.PayoutAccountResponse;
import com.fic.event_management_system.dto.PayoutOnboardingResponse;
import com.fic.event_management_system.service.PortalPayoutAccountService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portal/payout-account")
public class PortalPayoutAccountController {

    private final PortalPayoutAccountService payoutAccountService;

    public PortalPayoutAccountController(
            PortalPayoutAccountService payoutAccountService) {
        this.payoutAccountService = payoutAccountService;
    }

    @GetMapping
    public PayoutAccountResponse getCurrentAccount() {
        return payoutAccountService.getCurrentPortalAccount();
    }

    @PostMapping("/onboarding")
    public PayoutOnboardingResponse startOnboarding(
            @RequestBody CreatePayoutOnboardingRequest request) {

        return payoutAccountService.startOnboarding(request);
    }
}
