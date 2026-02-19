package com.example.app.controller;

import com.example.app.service.CommandGuardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/api/terminal")
public class TerminalController {

    private final CommandGuardService guardService;

    public TerminalController(CommandGuardService guardService) {
        this.guardService = guardService;
    }

    @PostMapping("/execute")
    public ResponseEntity<?> execute(@RequestHeader("userid") String username,
                                     @RequestBody Map<String, Object> request) {

        String server = (String) request.get("server");
        String port = String.valueOf(request.get("port"));
        String command = (String) request.get("command");

        if (!guardService.isAllowed(username, command)) {
            Map<String, Object> response = new HashMap<>();
            response.put("log", "Command not allowed due to insufficient privileges");
            response.put("statuscode", -1);
            return ResponseEntity.ok(response);
        }

        String url = "https://" + server + ":" + port + "/api/v1/executecustom";

        Map<String, Object> payload = new HashMap<>();
        payload.put("jobid", command);
        payload.put("processid", null);
        payload.put("force", null);
        payload.put("step", "");

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map> resp = restTemplate.postForEntity(url, payload, Map.class);

        return ResponseEntity.ok(resp.getBody());
    }
}
