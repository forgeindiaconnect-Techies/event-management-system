package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.User;
import java.util.List;

public interface UserService {

    User createUser(User user);

    User getUserById(Long id);

    List<User> getAllUsers();

    User updateUser(Long id, User user);

    List<User> getOrganizersByPortal(Long portalId);

    // NEW
    List<User> getUsersByPortal(Long portalId);
}