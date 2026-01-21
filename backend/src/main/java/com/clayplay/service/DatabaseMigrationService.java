package com.clayplay.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class DatabaseMigrationService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Checking for database migrations...");
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE lower(table_name) = 'organizator' AND lower(column_name) = 'status_organizator'",
                Integer.class
            );

            if (count != null && count == 0) {
                logger.info("Column 'status_organizator' missing in 'ORGANIZATOR' table. Adding it now...");
                jdbcTemplate.execute("ALTER TABLE ORGANIZATOR ADD COLUMN status_organizator TEXT NOT NULL DEFAULT 'APPROVED'");
                logger.info("Column 'status_organizator' added successfully.");
            } else {
                logger.info("Column 'status_organizator' already exists in 'ORGANIZATOR' table.");
            }
        } catch (Exception e) {
            logger.error("Error during database migration: ", e);
        }
    }
}
