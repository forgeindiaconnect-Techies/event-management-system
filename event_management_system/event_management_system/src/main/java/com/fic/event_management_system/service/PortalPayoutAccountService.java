package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.*;

public interface PortalPayoutAccountService {

    PayoutAccountResponse getCurrentPortalAccount();

    PayoutOnboardingResponse startOnboarding(
            CreatePayoutOnboardingRequest request
    );

    PayoutAccountResponse submitDevelopmentDetails(
            DevelopmentPayoutRequest request
    );

    PayoutAccountResponse updateDevelopmentStatus(
            DevelopmentPayoutStatusRequest request
    );
}
