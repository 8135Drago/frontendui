package com.example.app.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "server")
public class Server {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ip;
    private Integer port;
    private String user;
    private String env;
    private String name;
    private String project;
    private String type;

    public Long getId() { return id; }
    public String getIp() { return ip; }
    public Integer getPort() { return port; }
    public String getUser() { return user; }
    public String getEnv() { return env; }
    public String getName() { return name; }
    public String getProject() { return project; }
    public String getType() { return type; }

    public void setId(Long id) { this.id = id; }
    public void setIp(String ip) { this.ip = ip; }
    public void setPort(Integer port) { this.port = port; }
    public void setUser(String user) { this.user = user; }
    public void setEnv(String env) { this.env = env; }
    public void setName(String name) { this.name = name; }
    public void setProject(String project) { this.project = project; }
    public void setType(String type) { this.type = type; }
}
