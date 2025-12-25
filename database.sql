-- Database schema for Intelligent Traffic Monitoring System

CREATE DATABASE IF NOT EXISTS traffic_db;
USE traffic_db;

-- Table: traffic_logs
-- Stores the detected vehicle counts and alerts
CREATE TABLE IF NOT EXISTS traffic_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_vehicles INT NOT NULL,
    density_status VARCHAR(50) NOT NULL,
    vehicle_breakdown JSON,
    alert_type VARCHAR(100) DEFAULT NULL,
    snapshot_path VARCHAR(255) DEFAULT NULL
);

-- Table: settings
-- Configuration settings for the system
CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL
);

-- Example Insertion (Optional)
-- INSERT INTO settings (`key`, `value`) VALUES ('alert_threshold', '15');
