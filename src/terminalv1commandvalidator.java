package com.example.app.service;

import com.example.app.entity.User;
import com.example.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CommandGuardService {

    private final UserRepository userRepository;

    public CommandGuardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean isAllowed(String username, String command) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) return false;

        User user = optionalUser.get();

        if (user.getRole() != null && user.getRole().contains("ADMIN")) {
            return true;
        }

        if (user.getValidcommands() == null || user.getValidcommands().isBlank()) {
            return false;
        }

        String cleaned = command.replaceAll("`.*?`", "");
        String[] parts = cleaned.trim().split("\\s+");
        if (parts.length == 0) return false;

        String baseCommand = parts[0].toLowerCase();

        Set<String> allowed = new HashSet<>();
        for (String cmd : user.getValidcommands().split(",")) {
            allowed.add(cmd.trim().toLowerCase());
        }

        return allowed.contains(baseCommand);
    }
}
