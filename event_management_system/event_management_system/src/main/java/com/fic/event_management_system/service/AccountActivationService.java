package com.fic.event_management_system.service;
import com.fic.event_management_system.entity.User;
import java.util.Map;
public interface AccountActivationService {
    void sendPasswordSetupLink(User user);
    Map<String, Object> getPasswordSetupDetails(String token);
    void completePasswordSetup(String token, String password, String confirmPassword);
    void resendPasswordSetupLink(String token);
}
