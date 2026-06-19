-- Swibz AI Core Platform
-- Production PostgreSQL Database DDL Schema
-- Designed for Multi-Tenant Isolation with Indexes and Relationships
-- Supporting 10,000+ businesses and 1M+ conversations

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Custom Enum Types
CREATE TYPE industry_type AS ENUM (
  'delivery',
  'school',
  'clinic',
  'hotel',
  'real_estate',
  'sacco',
  'retail',
  'restaurant',
  'hardware',
  'security'
);

CREATE TYPE subscription_plan AS ENUM (
  'starter',
  'professional',
  'enterprise'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'past_due',
  'trial'
);

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'business_owner',
  'staff',
  'customer'
);

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'negotiation',
  'won',
  'lost'
);

CREATE TYPE channel_type AS ENUM (
  'whatsapp',
  'telegram',
  'webchat',
  'sms',
  'email'
);

CREATE TYPE conversation_status AS ENUM (
  'active',
  'resolved',
  'handed_over'
);

CREATE TYPE message_sender AS ENUM (
  'customer',
  'ai',
  'agent'
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'assigned',
  'in_transit',
  'completed',
  'cancelled'
);

CREATE TYPE rider_status AS ENUM (
  'available',
  'busy',
  'offline'
);

CREATE TYPE payment_gateway AS ENUM (
  'mtn_momo',
  'airtel_money',
  'stripe'
);

CREATE TYPE payment_status AS ENUM (
  'success',
  'pending',
  'failed'
);


-- 1. Tenants Table (Isolated via tenant_id)
CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  industry_type industry_type NOT NULL,
  subscription_plan subscription_plan NOT NULL DEFAULT 'starter',
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CREATE Tenancy Row Level Security (RLS) Policy Guide:
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 2. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE, -- Nullable for Super Admins
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  lead_score INT CHECK (lead_score >= 0 AND lead_score <= 100) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(tenant_id, phone),
  UNIQUE(tenant_id, email)
);

-- 4. Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  interest TEXT,
  estimated_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  score INT CHECK (score >= 0 AND score <= 100) DEFAULT 0 NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  channel channel_type NOT NULL DEFAULT 'webchat',
  last_message TEXT,
  status conversation_status NOT NULL DEFAULT 'active',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender message_sender NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- For tool_calls, workflow configs, extracted details
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Knowledge Base Table
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g. pdf, docx, txt, csv, url
  content_url TEXT,
  text_preview TEXT NOT NULL,
  chunk_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Visual Workflows Table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(255) NOT NULL, -- e.g., customer_requests_delivery
  nodes JSONB NOT NULL, -- Holds visual graph nodes configuration
  edges JSONB NOT NULL, -- Holds connection edges linking nodes
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Delivery Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  package_details TEXT,
  distance_km DECIMAL(8, 2) NOT NULL,
  duration_mins INT NOT NULL,
  fare_ugx DECIMAL(15, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  rider_id UUID, -- References Riders Table
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Riders Table
CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status rider_status NOT NULL DEFAULT 'available',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add Rider Reference to Orders
ALTER TABLE orders ADD CONSTRAINT fk_orders_rider FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE SET NULL;

-- 11. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX'::character varying NOT NULL,
  method payment_gateway NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  reference VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 12. Analytics Summary Cache Table (For system dashboard performance)
CREATE TABLE analytics_snapshots (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  total_tenants INT NOT NULL,
  total_revenue_ugx DECIMAL(20, 2) NOT NULL,
  ai_api_calls INT NOT NULL,
  active_customers INT NOT NULL,
  active_conversations INT NOT NULL
);


-- INDEXES FOR HIGH-THROUGHPUT QUERY OPTIMIZATION

-- Tenants indexes
CREATE INDEX idx_tenants_industry ON tenants(industry_type);

-- Users indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- Customers indexes
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Leads indexes
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_customer ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);

-- Conversations indexes
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_channel ON conversations(channel);

-- Messages indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);

-- Knowledge Base indexes
CREATE INDEX idx_kb_tenant ON knowledge_base(tenant_id);

-- Workflows indexes
CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);

-- Orders indexes
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_rider ON orders(rider_id);

-- Riders indexes
CREATE INDEX idx_riders_tenant ON riders(tenant_id);
CREATE INDEX idx_riders_status ON riders(status);

-- Payments indexes
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(reference);
