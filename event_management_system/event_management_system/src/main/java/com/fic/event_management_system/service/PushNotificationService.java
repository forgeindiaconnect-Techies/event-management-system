package com.fic.event_management_system.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PushNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);

    public boolean sendPushNotification(String targetFcmToken, String title, String body) {
        return sendPushNotification(targetFcmToken, title, body, null);
    }

    public boolean sendPushNotification(String targetFcmToken, String title, String body, Map<String, String> data) {
        if (targetFcmToken == null || targetFcmToken.trim().isEmpty()) {
            logger.debug("Cannot send push notification: targetFcmToken is null or empty");
            return false;
        }

        if (FirebaseApp.getApps().isEmpty()) {
            logger.warn("Cannot send push notification: FirebaseApp is not initialized");
            return false;
        }

        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(targetFcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            logger.info("Successfully sent FCM notification to [{}]: {}", targetFcmToken, response);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send FCM push notification: {}", e.getMessage(), e);
            return false;
        }
    }
}
