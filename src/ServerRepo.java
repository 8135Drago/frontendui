package com.example.app.repository;

import com.example.app.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServerRepository extends JpaRepository<Server, Long> {

    List<Server> findByProject(String project);

    List<Server> findByProjectAndEnv(String project, String env);
}
