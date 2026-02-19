package com.example.app.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    private String password;

    private String role;

    private Integer verified;

    @Column(length = 2000)
    private String validcommands;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getVerified() { return verified; }
    public void setVerified(Integer verified) { this.verified = verified; }

    public String getValidcommands() { return validcommands; }
    public void setValidcommands(String validcommands) { this.validcommands = validcommands; }
}
