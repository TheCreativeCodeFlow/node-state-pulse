package com.netlab.networksimulator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NetworkSimulatorApplication {

    public static void main(String[] args) {
        SpringApplication.run(NetworkSimulatorApplication.class, args);
    }
}