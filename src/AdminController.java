package com.example.app.controller;

import com.example.app.entity.User;
import com.example.app.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getAll() {
        return userRepository.findAll();
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User updated) {
        User user = userRepository.findById(id).orElseThrow();
        user.setUsername(updated.getUsername());
        user.setRole(updated.getRole());
        user.setVerified(updated.getVerified());
        user.setValidcommands(updated.getValidcommands());
        return userRepository.save(user);
    }
}
