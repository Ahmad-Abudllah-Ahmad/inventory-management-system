-- Al Umer Mobile - Database Initialization Script
-- This script sets up the database with initial configurations

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS al_umer_mobile_db;

-- Use the database
\c al_umer_mobile_db;

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created after Prisma migration, but listed here for reference

-- User table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Product table indexes
-- CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
-- CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
-- CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
-- CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
-- CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
-- CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- Sale table indexes
-- CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
-- CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
-- CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
-- CREATE INDEX IF NOT EXISTS idx_sales_salesperson ON sales(sales_person_id);

-- Purchase table indexes
-- CREATE INDEX IF NOT EXISTS idx_purchases_number ON purchases(purchase_number);
-- CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
-- CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(created_at);
-- CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Stock movement indexes
-- CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
-- CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
-- CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Customer table indexes
-- CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
-- CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
-- CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- Session table indexes
-- CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
-- CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Stock alert indexes
-- CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id);
-- CREATE INDEX IF NOT EXISTS idx_stock_alerts_type ON stock_alerts(type);
-- CREATE INDEX IF NOT EXISTS idx_stock_alerts_active ON stock_alerts(is_active);

-- Set up database configuration for optimal performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
