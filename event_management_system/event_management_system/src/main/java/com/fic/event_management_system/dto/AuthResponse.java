package com.fic.event_management_system.dto;

public class AuthResponse {

    private String token;
    private String role;
    private String email;
    private String portalName;
    private Long userId;
    private Long portalId;
    private String portalCode;
    private String redirectPath;

    public AuthResponse() {
    }

    public AuthResponse(String token, String role, String email) {
        this.token = token;
        this.role = role;
        this.email = email;
    }

    public AuthResponse(
            String token,
            String role,
            String email,
            Long userId,
            Long portalId,
            String portalCode,
            String portalName,
            String redirectPath) {

        this.token = token;
        this.role = role;
        this.email = email;
        this.userId = userId;
        this.portalId = portalId;
        this.portalCode = portalCode;
        this.portalName = portalName;
        this.redirectPath = redirectPath;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getPortalId() {
        return portalId;
    }

    public void setPortalId(Long portalId) {
        this.portalId = portalId;
    }

    public String getPortalCode() {
        return portalCode;
    }

    public void setPortalCode(String portalCode) {
        this.portalCode = portalCode;
    }

    public String getRedirectPath() {
        return redirectPath;
    }

    public void setRedirectPath(String redirectPath) {
        this.redirectPath = redirectPath;
    }

	public String getPortalName() {
		return portalName;
	}

	public void setPortalName(String portalName) {
		this.portalName = portalName;
	}
    
}