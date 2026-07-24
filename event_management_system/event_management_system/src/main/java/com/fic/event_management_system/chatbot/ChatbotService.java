package com.fic.event_management_system.chatbot;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ChatbotService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final URI chatEndpoint;

    public ChatbotService(
            ObjectMapper objectMapper,
            @Value("${chatbot.api-url}") String chatbotApiUrl) {

        String baseUrl = chatbotApiUrl.endsWith("/")
                ? chatbotApiUrl.substring(0, chatbotApiUrl.length() - 1)
                : chatbotApiUrl;

        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        this.objectMapper = objectMapper;
        this.chatEndpoint = URI.create(baseUrl + "/chat");
    }

    public ChatResponse ask(ChatRequest request) {
        if (request == null
                || request.message() == null
                || request.message().isBlank()) {

            throw new IllegalArgumentException(
                    "Message cannot be empty"
            );
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("message", request.message().trim());
        payload.put("role", request.role());
        payload.put("portalId", request.portalId());
        payload.put("eventId", request.eventId());

        ChatResponse response;

        try {
            String jsonBody = objectMapper.writeValueAsString(payload);
            StringBuilder requestUrl = new StringBuilder(chatEndpoint.toString())
                    .append("?message=")
                    .append(encode(request.message().trim()));

            appendQueryParameter(requestUrl, "role", request.role());
            appendQueryParameter(requestUrl, "portalId", request.portalId());
            appendQueryParameter(requestUrl, "eventId", request.eventId());

            URI requestUri = URI.create(requestUrl.toString());

            HttpRequest httpRequest = HttpRequest.newBuilder(requestUri)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (httpResponse.statusCode() < 200
                    || httpResponse.statusCode() >= 300) {
                throw new IllegalStateException(
                        "Chatbot API returned HTTP "
                                + httpResponse.statusCode()
                                + ": "
                                + httpResponse.body()
                );
            }

            response = objectMapper.readValue(
                    httpResponse.body(),
                    ChatResponse.class
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Chatbot request was interrupted",
                    exception
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to communicate with the chatbot service",
                    exception
            );
        }

        if (response == null
                || response.answer() == null
                || response.answer().isBlank()) {

            throw new IllegalStateException(
                    "The chatbot returned an empty response"
            );
        }

        return response;
    }

    private String encode(Object value) {
        return URLEncoder.encode(
                String.valueOf(value),
                StandardCharsets.UTF_8
        );
    }

    private void appendQueryParameter(
            StringBuilder requestUrl,
            String name,
            Object value) {

        if (value != null) {
            requestUrl.append("&")
                    .append(name)
                    .append("=")
                    .append(encode(value));
        }
    }
}
