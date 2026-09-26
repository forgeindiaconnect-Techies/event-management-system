package com.fic.event_management_system.service;

import com.fic.event_management_system.dto.SuperAdminTheaterDashboardResponse;
import com.fic.event_management_system.dto.TheaterDirectoryResponse;
import com.fic.event_management_system.dto.TheaterEmailLogResponse;
import com.fic.event_management_system.dto.TheaterEmailStatsResponse;
import com.fic.event_management_system.dto.TheaterPayoutLedgerResponse;
import com.fic.event_management_system.dto.TheaterPortalUserResponse;

import java.util.List;
import com.fic.event_management_system.dto.PlatformRevenueConfigDTO;
import com.fic.event_management_system.dto.UnlockCommissionRequest;
import com.fic.event_management_system.dto.LockCommissionRequest;

public interface SuperAdminTheaterService {
    SuperAdminTheaterDashboardResponse getDashboardOverview();
    List<TheaterDirectoryResponse> getTheaterPortals();
    List<TheaterPortalUserResponse> getTheaterUsers();
    List<TheaterPayoutLedgerResponse> getTheaterPayouts();
    TheaterEmailStatsResponse getTheaterEmailStats();
    List<TheaterEmailLogResponse> getTheaterEmailLogs();
    PlatformRevenueConfigDTO getRevenueSettings();
    PlatformRevenueConfigDTO unlockCommission(UnlockCommissionRequest request);
    PlatformRevenueConfigDTO lockCommission(LockCommissionRequest request);
    PlatformRevenueConfigDTO updateRevenueSettings(PlatformRevenueConfigDTO request);
}

