package com.example.app.controller;

import com.example.app.entity.Server;
import com.example.app.repository.ServerRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/servers")
public class ServerController {

    private final ServerRepository repository;

    public ServerController(ServerRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/projects")
    public List<String> getProjects() {
        return repository.findAll()
                .stream()
                .map(Server::getProject)
                .distinct()
                .collect(Collectors.toList());
    }

    @GetMapping("/envs")
    public List<String> getEnvs(@RequestParam String project) {
        return repository.findByProject(project)
                .stream()
                .map(Server::getEnv)
                .distinct()
                .collect(Collectors.toList());
    }

    @GetMapping
    public List<Server> getServers(@RequestParam String project,
                                   @RequestParam String env) {
        return repository.findByProjectAndEnv(project, env);
    }
}
