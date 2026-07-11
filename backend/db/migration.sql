-- PostgreSQL DDL Migration Script for BLCTS Core Schema
-- Enterprise-aligned: 3 roles, enterprise maintenance workflow, property assignments

-- Enable UUID extension for cryptographic primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create 'users' table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('administrator', 'facility_manager', 'building_owner')),
    organization VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create 'buildings' table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    building_type VARCHAR(100) DEFAULT 'Commercial',
    total_capex DECIMAL(15,2) DEFAULT 0.00 CHECK (total_capex >= 0),
    total_opex DECIMAL(15,2) DEFAULT 0.00 CHECK (total_opex >= 0),
    estimated_floor_area INTEGER DEFAULT 0,
    floors INTEGER DEFAULT 1,
    county VARCHAR(100) DEFAULT 'Nairobi',
    city VARCHAR(100) DEFAULT 'Nairobi CBD',
    health_grade VARCHAR(10) DEFAULT 'A',
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Under Construction', 'Renovation', 'Archived')),
    assigned_to UUID REFERENCES users(id),
    owner VARCHAR(255),
    developer VARCHAR(255),
    construction_standard VARCHAR(20) DEFAULT 'Standard' CHECK (construction_standard IN ('Economy', 'Standard', 'Premium', 'Luxury')),
    is_soft_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create 'cost_entries' table
CREATE TABLE IF NOT EXISTS cost_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    phase VARCHAR(50) NOT NULL CHECK (phase IN ('capex', 'opex', 'maintenance', 'end-of-life')),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create 'maintenance_tasks' table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    component VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Preventive' CHECK (category IN ('Preventive', 'Corrective', 'Predictive', 'Emergency', 'Inspection')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Assigned', 'In-Progress', 'Completed', 'Verified', 'Overdue')),
    assigned_to VARCHAR(255),
    technician VARCHAR(255),
    vendor VARCHAR(255),
    estimated_cost DECIMAL(15,2) DEFAULT 0.00 CHECK (estimated_cost >= 0),
    actual_cost DECIMAL(15,2) DEFAULT 0.00 CHECK (actual_cost >= 0),
    target_date DATE NOT NULL,
    completed_date DATE,
    verified_by VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    parts_used TEXT,
    labour_hours DECIMAL(8,2) DEFAULT 0,
    downtime DECIMAL(8,2) DEFAULT 0,
    work_order_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create 'materials' table
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    supplier VARCHAR(255),
    manufacturer VARCHAR(255),
    unit VARCHAR(50) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL CHECK (current_price >= 0),
    lead_time_days INTEGER DEFAULT 0,
    availability VARCHAR(20) DEFAULT 'In Stock' CHECK (availability IN ('In Stock', 'Low Stock', 'Out of Stock', 'Pre-Order')),
    carbon_footprint DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create 'vendors' table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Contractor', 'Supplier', 'Consultant', 'Engineer')),
    category VARCHAR(100),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    contract_value DECIMAL(15,2) DEFAULT 0,
    contract_expiry DATE,
    performance_rating DECIMAL(3,1) DEFAULT 0 CHECK (performance_rating >= 0 AND performance_rating <= 5),
    compliance_certified BOOLEAN DEFAULT FALSE,
    compliance_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create 'assets' table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    installation_date DATE,
    expected_lifespan INTEGER DEFAULT 0,
    warranty_info TEXT,
    vendor VARCHAR(255),
    maintenance_schedule VARCHAR(20) DEFAULT 'Annually' CHECK (maintenance_schedule IN ('Monthly', 'Quarterly', 'Bi-Annually', 'Annually')),
    current_condition VARCHAR(20) DEFAULT 'Good' CHECK (current_condition IN ('New', 'Good', 'Fair', 'Poor', 'Critical')),
    replacement_cost DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create 'notifications' table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    channel VARCHAR(20) DEFAULT 'in-app'
);

-- 9. Create 'audit_logs' table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    building_id UUID
);

-- 10. Create 'compliance_items' table
CREATE TABLE IF NOT EXISTS compliance_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    regulation VARCHAR(255) NOT NULL,
    category VARCHAR(100) CHECK (category IN ('Building Codes', 'Fire Safety', 'OSHA', 'Environmental', 'Structural Inspection')),
    status VARCHAR(50) DEFAULT 'Pending Review' CHECK (status IN ('Compliant', 'Non-Compliant', 'Pending Review', 'Expired')),
    last_inspection_date DATE,
    next_inspection_date DATE,
    authority VARCHAR(255),
    notes TEXT
);

-- High-performance relational lookup indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cost_entries_building_id ON cost_entries(building_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_phase ON cost_entries(phase);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_building_id ON maintenance_tasks(building_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_assigned_to ON maintenance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_buildings_assigned_to ON buildings(assigned_to);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_notifications_building_id ON notifications(building_id);
CREATE INDEX IF NOT EXISTS idx_compliance_items_building_id ON compliance_items(building_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Automatic metadata timestamp progression function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply automatic timestamp update triggers
CREATE TRIGGER trigger_update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_buildings_timestamp BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_cost_entries_timestamp BEFORE UPDATE ON cost_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_maintenance_tasks_timestamp BEFORE UPDATE ON maintenance_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_materials_timestamp BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_vendors_timestamp BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_assets_timestamp BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_notifications_timestamp BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_compliance_items_timestamp BEFORE UPDATE ON compliance_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
