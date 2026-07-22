package com.fic.event_management_system.controller;

import com.fic.event_management_system.entity.User;
import com.fic.event_management_system.repository.UserRepository;
import com.fic.event_management_system.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService,
	                      UserRepository userRepository) {
	    this.userService = userService;
	}

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    @PutMapping("/{id}")
    public User updateUser(
            @PathVariable Long id,
            @RequestBody User user) {

        return userService.updateUser(id, user);
    }

    @PutMapping("/me/password")
    public String changeOwnPassword(@RequestBody ChangePasswordRequest request) {
        userService.changeOwnPassword(
                request.currentPassword(),
                request.newPassword()
        );
        return "Password changed successfully";
    }

    public record ChangePasswordRequest(
            String currentPassword,
            String newPassword
    ) {}
    
    @GetMapping("/organizers/portal/{portalId}")
    public List<User> getOrganizersByPortal(@PathVariable Long portalId) {
        return userService.getOrganizersByPortal(portalId);
    }
    
    @GetMapping("/portal/{portalId}")
    public List<User> getUsersByPortal(@PathVariable Long portalId) {
        return userService.getUsersByPortal(portalId);
    }

    @DeleteMapping("/{id}")
    public String deletePortalUser(@PathVariable Long id) {
        userService.deletePortalUser(id);
        return "User deleted successfully";
    }
}
