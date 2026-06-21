import { pgTable, text, integer, boolean, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  tenantId: text('tenant_id').primaryKey(),
  companyName: text('company_name').notNull(),
  industryType: text('industry_type').notNull(),
  subscriptionPlan: text('subscription_plan').notNull(),
  subscriptionStatus: text('subscription_status').notNull(),
  createdAt: text('created_at').notNull(),
  logoUrl: text('logo_url'),
  customAiInstructions: text('custom_ai_instructions'),
  physicalAddress: text('physical_address'),
  phoneNumber: text('phone_number'),
  emailAddress: text('email_address')
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(),
  createdAt: text('created_at').notNull()
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  leadScore: integer('lead_score').notNull(),
  createdAt: text('created_at').notNull()
});

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  customerId: text('customer_id').references(() => customers.id).notNull(),
  status: text('status').notNull(),
  interest: text('interest').notNull(),
  estimatedValue: doublePrecision('estimated_value').notNull(),
  score: integer('score').notNull(),
  summary: text('summary').notNull(),
  createdAt: text('created_at').notNull()
});

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  customerId: text('customer_id').references(() => customers.id).notNull(),
  channel: text('channel').notNull(),
  lastMessage: text('last_message').notNull(),
  updatedAt: text('updated_at').notNull(),
  status: text('status').notNull()
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversations.id).notNull(),
  sender: text('sender').notNull(),
  content: text('content').notNull(),
  timestamp: text('timestamp').notNull(),
  metadata: jsonb('metadata')
});

export const kbItems = pgTable('kb_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  contentUrl: text('content_url'),
  textPreview: text('text_preview').notNull(),
  chunkCount: integer('chunk_count').notNull(),
  createdAt: text('created_at').notNull()
});

export const workflows = pgTable('workflows', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  name: text('name').notNull(),
  triggerEvent: text('trigger_event').notNull(),
  nodes: jsonb('nodes').notNull(),
  edges: jsonb('edges').notNull(),
  isActive: boolean('is_active').notNull(),
  createdAt: text('created_at').notNull()
});

export const riders = pgTable('riders', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  status: text('status').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  createdAt: text('created_at').notNull()
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  customerId: text('customer_id').references(() => customers.id).notNull(),
  pickupAddress: text('pickup_address').notNull(),
  dropoffAddress: text('dropoff_address').notNull(),
  packageDetails: text('package_details').notNull(),
  distanceKm: doublePrecision('distance_km').notNull(),
  durationMins: integer('duration_mins').notNull(),
  fareUgx: integer('fare_ugx').notNull(),
  status: text('status').notNull(),
  riderId: text('rider_id').references(() => riders.id),
  createdAt: text('created_at').notNull()
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.tenantId).notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  method: text('method').notNull(),
  status: text('status').notNull(),
  reference: text('reference').notNull(),
  createdAt: text('created_at').notNull()
});
