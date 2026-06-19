/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { eq } from 'drizzle-orm';
import { db as pgDb } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import {
  Tenant,
  User,
  Customer,
  Lead,
  Conversation,
  Message,
  KnowledgeBaseItem,
  Workflow,
  Order,
  Rider,
  Payment,
  AnalyticsSummary,
  IndustryType,
  SubscriptionPlan
} from '../types.js';

const DB_FILE_PATH = path.join(process.cwd(), 'db-sim.json');

interface SchemaSim {
  tenants: Tenant[];
  users: User[];
  customers: Customer[];
  leads: Lead[];
  conversations: Conversation[];
  messages: Message[];
  knowledgeBase: KnowledgeBaseItem[];
  workflows: Workflow[];
  orders: Order[];
  riders: Rider[];
  payments: Payment[];
}

// --- High fidelity SQL-to-TypeScript mapping objects ---
const mapTenantToRow = (t: Tenant) => ({
  tenantId: t.tenant_id,
  companyName: t.company_name,
  industryType: t.industry_type,
  subscriptionPlan: t.subscription_plan,
  subscriptionStatus: t.subscription_status,
  createdAt: t.created_at,
});
const mapRowToTenant = (r: any): Tenant => ({
  tenant_id: r.tenantId,
  company_name: r.companyName,
  industry_type: r.industryType as IndustryType,
  subscription_plan: r.subscriptionPlan as SubscriptionPlan,
  subscription_status: r.subscriptionStatus,
  created_at: r.createdAt,
});

const mapUserToRow = (u: User) => ({
  id: u.id,
  tenantId: u.tenant_id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.created_at,
});
const mapRowToUser = (r: any): User => ({
  id: r.id,
  tenant_id: r.tenantId,
  name: r.name,
  email: r.email,
  role: r.role,
  created_at: r.createdAt,
});

const mapCustomerToRow = (c: Customer) => ({
  id: c.id,
  tenantId: c.tenant_id,
  name: c.name,
  phone: c.phone,
  email: c.email,
  leadScore: c.lead_score,
  createdAt: c.created_at,
});
const mapRowToCustomer = (r: any): Customer => ({
  id: r.id,
  tenant_id: r.tenantId,
  name: r.name,
  phone: r.phone,
  email: r.email,
  lead_score: r.leadScore,
  created_at: r.createdAt,
});

const mapLeadToRow = (l: Lead) => ({
  id: l.id,
  tenantId: l.tenant_id,
  customerId: l.customer_id,
  status: l.status,
  interest: l.interest,
  estimatedValue: Number(l.estimated_value),
  score: l.score,
  summary: l.summary,
  createdAt: l.created_at,
});
const mapRowToLead = (r: any): Lead => ({
  id: r.id,
  tenant_id: r.tenantId,
  customer_id: r.customerId,
  status: r.status,
  interest: r.interest,
  estimated_value: Number(r.estimatedValue),
  score: r.score,
  summary: r.summary,
  created_at: r.createdAt,
});

const mapConversationToRow = (c: Conversation) => ({
  id: c.id,
  tenantId: c.tenant_id,
  customerId: c.customer_id,
  channel: c.channel,
  lastMessage: c.last_message,
  updatedAt: c.updated_at,
  status: c.status,
});
const mapRowToConversation = (r: any): Conversation => ({
  id: r.id,
  tenant_id: r.tenantId,
  customer_id: r.customerId,
  channel: r.channel as Conversation['channel'],
  last_message: r.lastMessage,
  updated_at: r.updatedAt,
  status: r.status as Conversation['status'],
});

const mapMessageToRow = (m: Message) => ({
  id: m.id,
  conversationId: m.conversation_id,
  sender: m.sender,
  content: m.content,
  timestamp: m.timestamp,
  metadata: m.metadata || null,
});
const mapRowToMessage = (r: any): Message => ({
  id: r.id,
  conversation_id: r.conversationId,
  sender: r.sender as Message['sender'],
  content: r.content,
  timestamp: r.timestamp,
  metadata: r.metadata || undefined,
});

const mapKBToRow = (k: KnowledgeBaseItem) => ({
  id: k.id,
  tenantId: k.tenant_id,
  name: k.name,
  type: k.type,
  contentUrl: k.content_url || null,
  textPreview: k.text_preview,
  chunkCount: k.chunk_count,
  createdAt: k.created_at,
});
const mapRowToKB = (r: any): KnowledgeBaseItem => ({
  id: r.id,
  tenant_id: r.tenantId,
  name: r.name,
  type: r.type as KnowledgeBaseItem['type'],
  content_url: r.contentUrl || undefined,
  text_preview: r.textPreview,
  chunk_count: r.chunkCount,
  created_at: r.createdAt,
});

const mapWorkflowToRow = (w: Workflow) => ({
  id: w.id,
  tenantId: w.tenant_id,
  name: w.name,
  triggerEvent: w.trigger_event,
  nodes: w.nodes,
  edges: w.edges,
  isActive: w.is_active,
  createdAt: w.created_at,
});
const mapRowToWorkflow = (r: any): Workflow => ({
  id: r.id,
  tenant_id: r.tenantId,
  name: r.name,
  trigger_event: r.triggerEvent,
  nodes: r.nodes as any,
  edges: r.edges as any,
  is_active: r.isActive,
  created_at: r.createdAt,
});

const mapRiderToRow = (ri: Rider) => ({
  id: ri.id,
  tenantId: ri.tenant_id,
  name: ri.name,
  phone: ri.phone,
  status: ri.status,
  latitude: ri.latitude,
  longitude: ri.longitude,
  createdAt: ri.created_at,
});
const mapRowToRider = (r: any): Rider => ({
  id: r.id,
  tenant_id: r.tenantId,
  name: r.name,
  phone: r.phone,
  status: r.status as Rider['status'],
  latitude: r.latitude,
  longitude: r.longitude,
  created_at: r.createdAt,
});

const mapOrderToRow = (o: Order) => ({
  id: o.id,
  tenantId: o.tenant_id,
  customerId: o.customer_id,
  pickupAddress: o.pickup_address,
  dropoffAddress: o.dropoff_address,
  packageDetails: o.package_details,
  distanceKm: o.distance_km,
  durationMins: o.duration_mins,
  fareUgx: o.fare_ugx,
  status: o.status,
  riderId: o.rider_id,
  createdAt: o.created_at,
});
const mapRowToOrder = (r: any): Order => ({
  id: r.id,
  tenant_id: r.tenantId,
  customer_id: r.customerId,
  pickup_address: r.pickupAddress,
  dropoff_address: r.dropoffAddress,
  package_details: r.packageDetails,
  distance_km: r.distanceKm,
  duration_mins: r.durationMins,
  fare_ugx: r.fareUgx,
  status: r.status as Order['status'],
  rider_id: r.riderId,
  created_at: r.createdAt,
});

const mapPaymentToRow = (p: Payment) => ({
  id: p.id,
  tenantId: p.tenant_id,
  amount: p.amount,
  currency: p.currency,
  method: p.method,
  status: p.status,
  reference: p.reference,
  createdAt: p.created_at,
});
const mapRowToPayment = (r: any): Payment => ({
  id: r.id,
  tenant_id: r.tenantId,
  amount: r.amount,
  currency: r.currency as Payment['currency'],
  method: r.method as Payment['method'],
  status: r.status as Payment['status'],
  reference: r.reference,
  created_at: r.createdAt,
});


// Initial Mock Seed Data
const defaultSeedData = (): SchemaSim => {
  const tenant1Id = 't-delivery-001';
  const tenant2Id = 't-school-002';
  const tenant3Id = 't-clinic-003';

  const customer1Id = 'c-001';
  const customer2Id = 'c-002';
  const customer3Id = 'c-003';

  const conv1Id = 'conv-001';
  const conv2Id = 'conv-002';
  const conv3Id = 'conv-003';

  const tenants: Tenant[] = [
    {
      tenant_id: tenant1Id,
      company_name: 'Kampala Express Logistics',
      industry_type: 'delivery',
      subscription_plan: 'professional',
      subscription_status: 'active',
      created_at: new Date('2026-01-10').toISOString(),
    },
    {
      tenant_id: tenant2Id,
      company_name: 'Green Hill International Academy',
      industry_type: 'school',
      subscription_plan: 'starter',
      subscription_status: 'trial',
      created_at: new Date('2026-05-15').toISOString(),
    },
    {
      tenant_id: tenant3Id,
      company_name: 'Victoria Wellness Clinic',
      industry_type: 'clinic',
      subscription_plan: 'enterprise',
      subscription_status: 'active',
      created_at: new Date('2025-11-20').toISOString(),
    }
  ];

  const users: User[] = [
    {
      id: 'u-admin-001',
      tenant_id: null,
      name: 'Benon Ndayizeye',
      email: 'ndayizeyebenon@gmail.com',
      role: 'super_admin',
      created_at: new Date('2025-01-01').toISOString(),
    },
    {
      id: 'u-biz-001',
      tenant_id: tenant1Id,
      name: 'John Mugisha',
      email: 'john@kampalaexpress.com',
      role: 'business_owner',
      created_at: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'u-biz-002',
      tenant_id: tenant2Id,
      name: 'Sarah Namubiru',
      email: 'sarah@greenhill.ac.ug',
      role: 'business_owner',
      created_at: new Date('2026-05-15').toISOString(),
    }
  ];

  const customers: Customer[] = [
    {
      id: customer1Id,
      tenant_id: tenant1Id,
      name: 'Derrick Opio',
      phone: '+256772112233',
      email: 'derrick.opio@gmail.com',
      lead_score: 92,
      created_at: new Date('2026-06-15').toISOString(),
    },
    {
      id: customer2Id,
      tenant_id: tenant2Id,
      name: 'Grace Atwine',
      phone: '+256782445566',
      email: 'grace.at@yahoo.com',
      lead_score: 85,
      created_at: new Date('2026-06-16').toISOString(),
    },
    {
      id: customer3Id,
      tenant_id: tenant3Id,
      name: 'Robert Kiggundu',
      phone: '+256701778899',
      email: 'rkiggundu@gmail.com',
      lead_score: 74,
      created_at: new Date('2026-06-17').toISOString(),
    }
  ];

  const leads: Lead[] = [
    {
      id: 'l-001',
      tenant_id: tenant1Id,
      customer_id: customer1Id,
      status: 'new',
      interest: 'Multi-stop delivery quote from Industrial Area to Mutungo',
      estimated_value: 35000,
      score: 95,
      summary: 'Automated workflow processed delivery order. High buying intent. Customer requested standard pricing.',
      created_at: new Date('2026-06-15').toISOString(),
    },
    {
      id: 'l-002',
      tenant_id: tenant2Id,
      customer_id: customer2Id,
      status: 'won',
      interest: 'S3 Term 2 Enrollment query for boarding student',
      estimated_value: 1800000,
      score: 85,
      summary: 'Parent inquired about S3 vacancies and school circulars. Enrolled successfully inside school workflow.',
      created_at: new Date('2026-06-16').toISOString(),
    }
  ];

  const conversations: Conversation[] = [
    {
      id: conv1Id,
      tenant_id: tenant1Id,
      customer_id: customer1Id,
      channel: 'whatsapp',
      last_message: 'Deliver package from Ntinda to Kololo',
      updated_at: new Date('2026-06-18T14:30:00Z').toISOString(),
      status: 'active',
    },
    {
      id: conv2Id,
      tenant_id: tenant2Id,
      customer_id: customer2Id,
      channel: 'webchat',
      last_message: 'Please send me the school fees structure for high school boarding section.',
      updated_at: new Date('2026-06-18T15:10:00Z').toISOString(),
      status: 'active',
    },
    {
      id: conv3Id,
      tenant_id: tenant3Id,
      customer_id: customer3Id,
      channel: 'telegram',
      last_message: 'Do you have dental appointments available tomorrow at 10 AM?',
      updated_at: new Date('2026-06-18T15:35:00Z').toISOString(),
      status: 'active',
    }
  ];

  const messages: Message[] = [
    {
      id: 'm-001',
      conversation_id: conv1Id,
      sender: 'customer',
      content: 'Hello, I want to deliver a package from Ntinda to Kololo.',
      timestamp: new Date('2026-06-18T14:28:00Z').toISOString(),
    },
    {
      id: 'm-002',
      conversation_id: conv1Id,
      sender: 'ai',
      content: 'Sure! I can calculate the delivery quote for you. Let me check the coordinates and lookup the distance.',
      timestamp: new Date('2026-06-18T14:29:00Z').toISOString(),
      metadata: {
        tool_calls: [
          {
            name: 'calculate_delivery_price',
            args: { pickup: 'Ntinda', dropoff: 'Kololo' },
            result: { distance_km: 4.8, calculated_fare_ugx: 10000 }
          }
        ],
        workflow_triggered: 'Calculate Price Workflow',
      }
    },
    {
      id: 'm-003',
      conversation_id: conv1Id,
      sender: 'customer',
      content: 'Okay, go ahead and book it. Deliver package from Ntinda to Kololo.',
      timestamp: new Date('2026-06-18T14:30:00Z').toISOString(),
    },
    {
      id: 'm-004',
      conversation_id: conv2Id,
      sender: 'customer',
      content: 'Good morning! Please send me the school fees structure for high school boarding section.',
      timestamp: new Date('2026-06-18T15:08:00Z').toISOString(),
    },
    {
      id: 'm-005',
      conversation_id: conv2Id,
      sender: 'ai',
      content: 'Good morning! Here is the latest school fees structure for Green Hill High School Boarding Section (S1 - S6):\n- Tuition & Boarding: UGX 1,800,000 per term\n- Registration (New Students): UGX 150,000\n- Admission Fee: UGX 100,000\n\nWould you like me to send you the online registration link or set up a school tour appointment?',
      timestamp: new Date('2026-06-18T15:10:00Z').toISOString(),
      metadata: {
        workflow_triggered: 'School Fees Inquiry Workflow',
      }
    },
    {
      id: 'm-006',
      conversation_id: conv3Id,
      sender: 'customer',
      content: 'Do you have dental appointments available tomorrow at 10 AM?',
      timestamp: new Date('2026-06-18T15:33:00Z').toISOString(),
    },
    {
      id: 'm-007',
      conversation_id: conv3Id,
      sender: 'ai',
      content: 'Let me query our calendar database... Yes, Victoria Wellness Clinic has a dental opening tomorrow, Friday June 19th, at 10:00 AM with Dr. Brenda Namaganda. Would you like me to reserve this under the phone contact +256701778899?',
      timestamp: new Date('2026-06-18T15:35:00Z').toISOString(),
      metadata: {
        tool_calls: [
          {
            name: 'check_available_slots',
            args: { department: 'dental', date: '2026-06-19', time: '10:00' },
            result: { available: true, doctor: 'Dr. Brenda Namaganda' }
          }
        ],
        workflow_triggered: 'Appointment Scheduling Workflow',
      }
    }
  ];

  const knowledgeBase: KnowledgeBaseItem[] = [
    {
      id: 'kb-001',
      tenant_id: tenant1Id,
      name: 'Kampala Express Pricing Chart 2026.pdf',
      type: 'pdf',
      text_preview: 'Kampala Logistics delivery pricing structure. Base fare: UGX 4,000 within Kampala central. Distance multiplier: UGX 1,500 per KM. Idle / wait time: UGX 500 per 5 minutes. Major zones: Ntinda, Nakasero, Kololo, Muyenga, Makerere, Lubaga.',
      chunk_count: 5,
      created_at: new Date('2026-01-11').toISOString(),
    },
    {
      id: 'kb-002',
      tenant_id: tenant2Id,
      name: 'School Regulations & Termly Fees 2026.txt',
      type: 'txt',
      text_preview: 'Green Hill Academy School Guide. Termly Academic Tuition Fees (High School): Boarding is UGX 1,800,000. Day scholar is UGX 1,100,000. All fees paid through Centenary Bank, Stanbic Bank or school mobile payment gate (Airtel Pay/MTN Pay code).',
      chunk_count: 3,
      created_at: new Date('2026-05-16').toISOString(),
    },
    {
      id: 'kb-003',
      tenant_id: tenant3Id,
      name: 'Victoria Wellness Services & Departments.csv',
      type: 'csv',
      text_preview: 'Victoria Wellness Clinic departments list: Dental (Dr. Brenda, Mon-Fri 8am-5pm), Pediatrics (Dr. Timothy, Mon-Sat 9am-6pm), General Medicine (Dr. Jude, 24/7), Physiotherapy (Dr. Arthur, Tue/Thu 1pm-5pm). Consultation standard: UGX 50,000.',
      chunk_count: 8,
      created_at: new Date('2025-11-21').toISOString(),
    }
  ];

  const workflows: Workflow[] = [
    {
      id: 'w-001',
      tenant_id: tenant1Id,
      name: 'Automated Delivery Quote Chain',
      trigger_event: 'customer_requests_delivery',
      is_active: true,
      nodes: [
        { id: 'n1', type: 'trigger', label: 'Customer Requests Delivery', description: 'Triggers when a prompt implies package dispatch interest.' },
        { id: 'n2', type: 'action', label: 'Extract Location Details', description: 'Analyze pickup and dropoff points in text.' },
        { id: 'n3', type: 'action', label: 'Calculate Distance & Fare', description: 'Queries distance matrix API and calculates price based on base fee (UGX 4,000) + distance * (UGX 1,500/KM).' },
        { id: 'n4', type: 'action', label: 'Generate Quote & Notify', description: 'Returns formal quote blocks to communication channel.' }
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }
      ],
      created_at: new Date('2026-01-12').toISOString(),
    },
    {
      id: 'w-002',
      tenant_id: tenant2Id,
      name: 'Academic Inquiries Responder',
      trigger_event: 'parent_inquiry',
      is_active: true,
      nodes: [
        { id: 'sn1', type: 'trigger', label: 'Parent Inquiry Received', description: 'Triggers on school fees, calendar, admissions, or vacancies.' },
        { id: 'sn2', type: 'action', label: 'RAG Knowledge Lookup', description: 'Searches academy handbook text vectors.' },
        { id: 'sn3', type: 'action', label: 'Collect Parent Info', description: 'Create lead details: student name, term, class level.' },
        { id: 'sn4', type: 'action', label: 'Send Answer + Catalog PDF', description: 'Respond to parental inbox with documents.' }
      ],
      edges: [
        { from: 'sn1', to: 'sn2' },
        { from: 'sn2', to: 'sn3' },
        { from: 'sn3', to: 'sn4' }
      ],
      created_at: new Date('2026-05-17').toISOString(),
    }
  ];

  const orders: Order[] = [
    {
      id: 'o-001',
      tenant_id: tenant1Id,
      customer_id: customer1Id,
      pickup_address: 'Ntinda Complex, Kampala',
      dropoff_address: 'Kololo Heights, Kampala',
      package_details: 'Documents pouch and laptops bag',
      distance_km: 4.8,
      duration_mins: 15,
      fare_ugx: 10000,
      status: 'in_transit',
      rider_id: 'r-001',
      created_at: new Date('2026-06-18T14:31:00Z').toISOString(),
    },
    {
      id: 'o-002',
      tenant_id: tenant1Id,
      customer_id: customer1Id,
      pickup_address: 'Industrial Area, Kampala',
      dropoff_address: 'Mutungo Hill, Kampala',
      package_details: 'Carton of office supplies',
      distance_km: 9.2,
      duration_mins: 28,
      fare_ugx: 18000,
      status: 'completed',
      rider_id: 'r-002',
      created_at: new Date('2026-06-17T11:20:00Z').toISOString(),
    }
  ];

  const riders: Rider[] = [
    {
      id: 'r-001',
      tenant_id: tenant1Id,
      name: 'Alex Mukasa',
      phone: '+256779554433',
      status: 'busy',
      latitude: 0.33612,
      longitude: 32.61245,
      created_at: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'r-002',
      tenant_id: tenant1Id,
      name: 'Ivan Ssewankambo',
      phone: '+256781223344',
      status: 'available',
      latitude: 0.31361,
      longitude: 32.58112,
      created_at: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'r-003',
      tenant_id: tenant1Id,
      name: 'Brian Okello',
      phone: '+256702667788',
      status: 'offline',
      latitude: 0.32014,
      longitude: 32.59918,
      created_at: new Date('2026-01-15').toISOString(),
    }
  ];

  const payments: Payment[] = [
    {
      id: 'p-001',
      tenant_id: tenant1Id,
      amount: 150000,
      currency: 'UGX',
      method: 'mtn_momo',
      status: 'success',
      reference: 'MOMO-20260618-99120',
      created_at: new Date('2026-06-18T10:00:00Z').toISOString(),
    },
    {
      id: 'p-002',
      tenant_id: tenant2Id,
      amount: 50000,
      currency: 'UGX',
      method: 'airtel_money',
      status: 'success',
      reference: 'ARTL-20260615-54201',
      created_at: new Date('2026-06-15T09:15:00Z').toISOString(),
    },
    {
      id: 'p-003',
      tenant_id: tenant3Id,
      amount: 500000,
      currency: 'UGX',
      method: 'stripe',
      status: 'success',
      reference: 'ch_stripe_8f4323j12108d',
      created_at: new Date('2026-06-12T16:45:00Z').toISOString(),
    }
  ];

  return {
    tenants,
    users,
    customers,
    leads,
    conversations,
    messages,
    knowledgeBase,
    workflows,
    orders,
    riders,
    payments
  };
};

class SimulatedDB {
  private data: SchemaSim;
  private isLoaded = false;

  constructor() {
    this.data = defaultSeedData();
    this.init();
  }

  private async init() {
    try {
      // Create tables first by pulling or checking active databases
      const pgTenants = await pgDb.select().from(schema.tenants);
      if (pgTenants.length === 0) {
        console.log('PostgreSQL database database is empty. Seeding with default dataset...');
        const seed = defaultSeedData();
        
        // Seed database cleanly
        for (const t of seed.tenants) {
          await pgDb.insert(schema.tenants).values(mapTenantToRow(t));
        }
        for (const u of seed.users) {
          await pgDb.insert(schema.users).values(mapUserToRow(u));
        }
        for (const c of seed.customers) {
          await pgDb.insert(schema.customers).values(mapCustomerToRow(c));
        }
        for (const r of seed.riders) {
          await pgDb.insert(schema.riders).values(mapRiderToRow(r));
        }
        for (const k of seed.knowledgeBase) {
          await pgDb.insert(schema.kbItems).values(mapKBToRow(k));
        }
        for (const w of seed.workflows) {
          await pgDb.insert(schema.workflows).values(mapWorkflowToRow(w));
        }
        for (const conv of seed.conversations) {
          await pgDb.insert(schema.conversations).values(mapConversationToRow(conv));
        }
        for (const m of seed.messages) {
          await pgDb.insert(schema.messages).values(mapMessageToRow(m));
        }
        for (const o of seed.orders) {
          await pgDb.insert(schema.orders).values(mapOrderToRow(o));
        }
        for (const l of seed.leads) {
          await pgDb.insert(schema.leads).values(mapLeadToRow(l));
        }
        for (const p of seed.payments) {
          await pgDb.insert(schema.payments).values(mapPaymentToRow(p));
        }
        console.log('PostgreSQL database seeded successfully.');
      }

      // Read back all records
      const rowsTenants = await pgDb.select().from(schema.tenants);
      const rowsUsers = await pgDb.select().from(schema.users);
      const rowsCustomers = await pgDb.select().from(schema.customers);
      const rowsLeads = await pgDb.select().from(schema.leads);
      const rowsConversations = await pgDb.select().from(schema.conversations);
      const rowsMessages = await pgDb.select().from(schema.messages);
      const rowsKB = await pgDb.select().from(schema.kbItems);
      const rowsWorkflows = await pgDb.select().from(schema.workflows);
      const rowsOrders = await pgDb.select().from(schema.orders);
      const rowsRiders = await pgDb.select().from(schema.riders);
      const rowsPayments = await pgDb.select().from(schema.payments);

      this.data = {
        tenants: rowsTenants.map(mapRowToTenant),
        users: rowsUsers.map(mapRowToUser),
        customers: rowsCustomers.map(mapRowToCustomer),
        leads: rowsLeads.map(mapRowToLead),
        conversations: rowsConversations.map(mapRowToConversation),
        messages: rowsMessages.map(mapRowToMessage),
        knowledgeBase: rowsKB.map(mapRowToKB),
        workflows: rowsWorkflows.map(mapRowToWorkflow),
        orders: rowsOrders.map(mapRowToOrder),
        riders: rowsRiders.map(mapRowToRider),
        payments: rowsPayments.map(mapRowToPayment),
      };

      this.isLoaded = true;
      console.log('Synchronized complete data structures from Cloud SQL.');
      this.saveLocalBackup();
    } catch (e) {
      console.error('Postgres loading failed; running fallback offline-cache mode:', e);
      this.loadLocalBackup();
    }
  }

  private loadLocalBackup() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          tenants: parsed.tenants || [],
          users: parsed.users || [],
          customers: parsed.customers || [],
          leads: parsed.leads || [],
          conversations: parsed.conversations || [],
          messages: parsed.messages || [],
          knowledgeBase: parsed.knowledgeBase || [],
          workflows: parsed.workflows || [],
          orders: parsed.orders || [],
          riders: parsed.riders || [],
          payments: parsed.payments || []
        };
      }
    } catch (e) {
      console.error('Local backup parse error:', e);
    }
  }

  private saveLocalBackup() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Local backup write error:', e);
    }
  }

  public save() {
    this.saveLocalBackup();
  }

  private generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // --- Tenants ---
  public getTenants(): Tenant[] {
    return this.data.tenants;
  }

  public getTenant(tenantId: string): Tenant | undefined {
    return this.data.tenants.find((t) => t.tenant_id === tenantId);
  }

  public async createTenant(company_name: string, industry_type: IndustryType, plan: SubscriptionPlan = 'starter', preload_templates: boolean = true): Promise<Tenant> {
    const tenant_id = this.generateId('t');
    const newTenant: Tenant = {
      tenant_id,
      company_name,
      industry_type,
      subscription_plan: plan,
      subscription_status: plan === 'starter' ? 'trial' : 'active',
      created_at: new Date().toISOString()
    };
    this.data.tenants.push(newTenant);

    // Persist to Cloud SQL
    try {
      await pgDb.insert(schema.tenants).values(mapTenantToRow(newTenant));
    } catch (e) {
      console.error('Error inserts tenant:', e);
    }

    await this.bootstrapIndustryWorkflows(newTenant, preload_templates);
    this.save();
    return newTenant;
  }

  private async bootstrapIndustryWorkflows(t: Tenant, preload_templates: boolean) {
    const baseNodes = [
      { id: 'bn1', type: 'trigger' as const, label: `${t.company_name} - Message Received`, description: `Triggers on inbound customer message.` },
      { id: 'bn2', type: 'action' as const, label: `Evaluate NLP Intent`, description: `Core engine checks knowledge base and functions.` },
    ];

    let customNodes = [];
    let trigger_event = 'message_received';

    if (t.industry_type === 'delivery') {
      trigger_event = 'customer_requests_delivery';
      customNodes = [
        { id: 'bn3', type: 'action' as const, label: 'Calculate Routing & Price', description: 'Queries distance rules and quotes the customer.' },
        { id: 'bn4', type: 'action' as const, label: 'Notify Available Courier Dispatcher', description: 'Finds the closest rider and pushes notification.' }
      ];
    } else if (t.industry_type === 'school') {
      trigger_event = 'parent_inquiry';
      customNodes = [
        { id: 'bn3', type: 'action' as const, label: 'Query Academy Prospectus Book', description: 'Checks term calendar and fee structure.' },
        { id: 'bn4', type: 'action' as const, label: 'Score Parent Lead & Log Info', description: 'Files student lead data into School CRM.' }
      ];
    } else if (t.industry_type === 'clinic') {
      trigger_event = 'appointment_request';
      customNodes = [
        { id: 'bn2', type: 'action' as const, label: 'Verify Doctor Slot Status', description: 'Checks medical staff schedule boards.' },
        { id: 'bn4', type: 'action' as const, label: 'Queue Reservation & Send Reminders', description: 'Submits reservation queue task.' }
      ];
    } else {
      customNodes = [
        { id: 'bn3', type: 'action' as const, label: 'Search KB Semantic Vector Store', description: 'Matches questions with facts.' },
        { id: 'bn4', type: 'action' as const, label: 'Submit Conversational Feedback', description: 'Responds via WhatsApp/Webchat hook.' }
      ];
    }

    const mergedNodes = [...baseNodes, ...customNodes];
    const finalEdges = [
      { from: 'bn1', to: 'bn2' },
      { from: 'bn2', to: 'bn3' },
      { from: 'bn3', to: 'bn4' }
    ];

    const workflow: Workflow = {
      id: this.generateId('w'),
      tenant_id: t.tenant_id,
      name: `${t.company_name} AI Core Workflow`,
      trigger_event,
      nodes: mergedNodes,
      edges: finalEdges,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.data.workflows.push(workflow);
    try {
      await pgDb.insert(schema.workflows).values(mapWorkflowToRow(workflow));
    } catch (e) {
      console.error('Error insert workflow:', e);
    }

    let kbText = '';
    if (preload_templates) {
      switch (t.industry_type) {
        case 'delivery':
          kbText = `[${t.company_name} Delivery and Dispatch Policy Manual]
- Operational Base: Kampala Central, serving all zones.
- Base Dispatch Price: UGX 4,000 within Kampala central standard zones.
- Distance Rate: UGX 1,500 per kilometer calculated automatically via maps coordinates.
- Cargo Limit: Safe motorcycle couriers limited to parcels under 15KG.
- Main Coverage Zones: Ntinda, Nakasero, Kololo, Muyenga, Makerere, Lubaga, Bugolobi, Wandegeya, Nakawa, Kabalagala, Mutungo, Naguru, Jinja Road, Kampala.
- Return/Cancellation Policy: Cancellations processed before courier dispatch are 100% free. If courier is already moving, a standard UGX 2,000 callback fee applies.`;
          break;
        case 'school':
          kbText = `[${t.company_name} Academic Guide and Circular Prospectus]
- Current Term: Term 2 2026 Academic Year.
- Boarding Section Fees: UGX 1,800,000 per term covers accommodation, tuition, text utilities, and wellness checkups.
- Day Scholars Tuition: UGX 1,100,000 per term including hot lunch.
- Admission Registration: Open for Senior One (S1), Senior Two (S2), Senior Three (S3) boarding section, and Senior Five (S5).
- Payment Outlets: Pay directly via Centenary Bank, Stanbic Bank, or our standard Merchant Code: 4321 (MTN Pay / Airtel Pay).
- Visitation Rules: Visiting day is every first Sunday of the month from 10:00 AM to 5:00 PM. Parents must carry student ID cards.`;
          break;
        case 'clinic':
          kbText = `[${t.company_name} Diagnostic Services and Practitioner Board]
- Medical Consultation Standard Fee: UGX 50,000 for standard general practitioner checkups.
- Dental Department: Led by Dr. Brenda Namaganda (Available Mon-Fri 8:00 AM to 5:00 PM) for extractions, dental implants, teeth whitening, and scaling services.
- Pediatrics Department: Led by Dr. Timothy Ssebunya (Available Mon-Sat 9:00 AM to 6:00 PM) covering child immunizations, growth monitoring, and baby checkups.
- General Medicine Department: Led by Dr. Jude Kato (24/7 emergency care active).
- Physiotherapy Services: Led by Dr. Arthur (Available Tuesday and Thursday afternoon 1:00 PM to 5:00 PM).
- Common Diagnostics & Scans: Full blood count (UGX 25,000), Malaria rapid test (UGX 10,000), Ultrasound scan (UGX 45,000), Typhoid test (UGX 15,000).`;
          break;
        case 'hotel':
          kbText = `[${t.company_name} Room Rates, Reservations, and Guest Policy]
- Check-in Hour: 12:00 PM (Noon). Check-out Deadline: 10:00 AM.
- Standard Single Room: UGX 120,000 per night, including a standard hot breakfast.
- Deluxe Twin Room: UGX 220,000 per night with standard breakfast and free access to health fitness club.
- Executive Sovereign Suite: UGX 450,000 per night with minibar, high-speed fiber Wi-Fi, premium views, and complimentary airport shuttle.
- Pearl Dining Restaurant: Kitchen open 24/7. Room service orders are dialable via intercom code 101.
- Airport Shuttle: Departs daily to Entebbe International Airport every 3 hours starting at 4:30 AM. Reservations required 12 hours in advance.`;
          break;
        case 'real_estate':
          kbText = `[${t.company_name} Properties Directory and Viewing Schedules]
- Featured Ntinda Offices: Ground-floor corporate spaces. Standard rent is UGX 1,200,000 per month. Water and secure guard patrol included.
- Kololo Executive Apartments: 2-bedroom executive duplex apartments, secure electric fencing, swimming pool, premium parking at UGX 2,500,000 per month.
- Land Plots for Sale: Titled plots in Gayaza and Mukono (standard dimensions 50ft x 100ft) start from UGX 18,000,000 with clean land registry deeds.
- Site Visiting Tours: Held every Saturday. Meeting point is at our central desk at 9:00 AM. Booking site tours requires customer contact verification.`;
          break;
        case 'sacco':
          kbText = `[${t.company_name} Financial Services and SACCO Dividend Guide]
- Share Capital Entry: Mandatory minimum of 20 shares at UGX 20,000 per share to unlock premium credit lines.
- Voluntary Savings Interest: Earns 5.5% locked annual compound interest paid out every November.
- SACCO Dividends: Approved annual dividends of 12% on share capital distributed to active members in December.
- Emergency Short Loans: Maximum loan of UGX 1,500,000, flat 1.5% interest rate, repayable within 6 months.
- Development Capital Loans: Access up to 3x your total savings amount. Disbursed cleanly within 48 business hours with standard 2 guarantors.`;
          break;
        case 'retail':
          kbText = `[${t.company_name} Stock Inventory, Branch Directories, and Invoice Rules]
- Central Branch: Kampala Nakasero Market Lane (Open Monday to Saturday 8:00 AM to 7:00 PM).
- Wholesale Supply Office accessories: Standard digital copying papers, office stationery, customized promotional uniforms.
- Stock Inquiries: Customers can query stock availability, sizes, and shipping weights live with the AI dispatcher.
- Return/Exchange Policy: Exchanges permitted within 3 calendar days of purchase upon presentation of the physical cash receipt.
- Corporate Discounts: Bulk purchases on items worth over UGX 500,000 earn an immediate 10% cash discount.`;
          break;
        case 'restaurant':
          kbText = `[${t.company_name} Dinner Menu, Daily Specials, and Booking Policies]
- Kitchen Hours: Daily from 10:00 AM to 11:30 PM.
- Fast Foods selection: Cheesy beef burger (UGX 18,000), Mega pepperoni pizza (UGX 22,000), Chicken nuggets with French fries (UGX 16,000).
- Traditional Ugandan Delicacies: Chicken luwombo with organic matooke, steamed rice, and groundnut paste (UGX 15,000).
- Coffee and beverages: Espresso (UGX 6,000), Iced Vanilla Latte (UGX 8,500), Organic local Passion fruit juice (UGX 5,000).
- Table Reservation Policy: Free of charge. Tables held for a maximum of 20 minutes from the reserved schedule.
- Takeaway Deliveries: Outward parcel dispatch is powered by our partner Kampala Express Logistics rider team.`;
          break;
        case 'hardware':
          kbText = `[${t.company_name} Construction Materials and Wholesales Catalog]
- Cement Supply: Portland cement Cement Grade 32.5R at UGX 38,000 per bag. Grade 42.5R high strength at UGX 42,000 per bag.
- Iron Sheets: Pre-painted metallic maroon corrugated sheets (30 Gauge) at UGX 48,000 per standard sheet.
- Domestic Wiring: Heavy-duty single-core copper wires (1.5mm) at UGX 95,000 per standard roll.
- Paint drums: Premium high-gloss weather-guard emulsion (20 Litres) at UGX 140,000.
- Logistics Dispatch: Heavy items can be dispatched to construction sites using our local flatbed 4-tonne Isuzu trucks at reasonable rates.`;
          break;
        case 'security':
          kbText = `[${t.company_name} Security Guarding Services and Rapid Response Guide]
- Corporate Guard Patrol: Trained professional security officers stationed at premises starting at UGX 350,000 per guard monthly turn.
- Residential Gate Sentries: Daytime and nighttime split shifts, with verified background checks and supervisor audits at UGX 280,000.
- VIP Bodyguard Escorts: Standard daily premium rates starting at UGX 150,000 per direct certified protection personnel.
- Electric Fence Installations: High-tension razor wires, warning sirens, fallback battery backups starting at UGX 1,800,000 for standard residential plots.
- Rapid Patrol Response Dispatch: Linked 24/7 with municipal security cells. Standard panic buttons prompt vehicle dispatch in under 8 minutes.`;
          break;
        default:
          kbText = `[${t.company_name} General Support FAQ]
- Operational Hour: Monday to Friday 8:00 AM to 5:00 PM.
- Core Industry Focus: Standard client support inside the ${t.industry_type} sector.
- Contacts: For support reach out to our team.`;
          break;
      }
    } else {
      kbText = `[${t.company_name} Draft Custom Training Log]
Welcome to the clean slate AI model workspace for ${t.company_name}.
This tenant was created with custom training choice. Please update this knowledge base text or upload custom PDFs, text, or CSV training logs to teach your specific custom agent.`;
    }

    const kb: KnowledgeBaseItem = {
      id: this.generateId('kb'),
      tenant_id: t.tenant_id,
      name: preload_templates ? `${t.company_name} Expert FAQ.txt` : `${t.company_name} Custom Training Log.txt`,
      type: 'txt',
      text_preview: kbText,
      chunk_count: preload_templates ? 5 : 1,
      created_at: new Date().toISOString()
    };
    this.data.knowledgeBase.push(kb);
    try {
      await pgDb.insert(schema.kbItems).values(mapKBToRow(kb));
    } catch (e) {
      console.error('Error insert kbItems:', e);
    }

    if (t.industry_type === 'delivery') {
      const r1: Rider = { id: this.generateId('r'), tenant_id: t.tenant_id, name: 'Sula Musoke', phone: '+25677112255', status: 'available', latitude: 0.3150, longitude: 32.5850, created_at: new Date().toISOString() };
      const r2: Rider = { id: this.generateId('r'), tenant_id: t.tenant_id, name: 'Richard Kato', phone: '+256702665511', status: 'available', latitude: 0.3220, longitude: 32.5950, created_at: new Date().toISOString() };
      this.data.riders.push(r1, r2);
      
      try {
        await pgDb.insert(schema.riders).values(mapRiderToRow(r1));
        await pgDb.insert(schema.riders).values(mapRiderToRow(r2));
      } catch (e) {
        console.error('Error inserts rider:', e);
      }
    }
  }

  // --- Users ---
  public getUsers(tenantId: string | null): User[] {
    if (tenantId === null) {
      return this.data.users;
    }
    return this.data.users.filter((u) => u.tenant_id === tenantId);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public async createUser(tenant_id: string | null, name: string, email: string, role: 'business_owner' | 'staff' | 'customer'): Promise<User> {
    const newUser: User = {
      id: this.generateId('u'),
      tenant_id,
      name,
      email,
      role,
      created_at: new Date().toISOString()
    };
    this.data.users.push(newUser);

    try {
      await pgDb.insert(schema.users).values(mapUserToRow(newUser));
    } catch (e) {
      console.error('Error insert user:', e);
      throw e;
    }

    this.save();
    return newUser;
  }

  // --- Customers ---
  public getCustomers(tenantId: string): Customer[] {
    return this.data.customers.filter((c) => c.tenant_id === tenantId);
  }

  public async getOrCreateCustomer(tenantId: string, name: string, phone: string, email: string = ''): Promise<Customer> {
    let customer = this.data.customers.find((c) => c.tenant_id === tenantId && (c.phone === phone || (email && c.email === email)));
    if (!customer) {
      customer = {
        id: this.generateId('c'),
        tenant_id: tenantId,
        name,
        phone,
        email: email || `${name.toLowerCase().replace(/\s+/g, '')}@example-customer.com`,
        lead_score: Math.floor(Math.random() * 40) + 40,
        created_at: new Date().toISOString()
      };
      this.data.customers.push(customer);

      try {
        await pgDb.insert(schema.customers).values(mapCustomerToRow(customer));
      } catch (e) {
        console.error('Error inserts customer:', e);
      }

      this.save();
    }
    return customer;
  }

  public updateCustomerLeadScore(id: string, score: number) {
    const customer = this.data.customers.find((c) => c.id === id);
    if (customer) {
      customer.lead_score = score;
      pgDb.update(schema.customers)
        .set({ leadScore: score })
        .where(eq(schema.customers.id, id))
        .catch((e) => console.error('Error update customer lead score:', e));

      this.save();
    }
  }

  // --- Leads ---
  public getLeads(tenantId: string): Lead[] {
    return this.data.leads.filter((l) => l.tenant_id === tenantId);
  }

  public createLead(tenantId: string, customerId: string, status: Lead['status'], interest: string, value: number, score: number, summary: string): Lead {
    const newLead: Lead = {
      id: this.generateId('l'),
      tenant_id: tenantId,
      customer_id: customerId,
      status,
      interest,
      estimated_value: value,
      score,
      summary,
      created_at: new Date().toISOString()
    };
    this.data.leads.push(newLead);

    pgDb.insert(schema.leads).values(mapLeadToRow(newLead))
      .catch((e) => console.error('Error inserts lead:', e));

    this.save();
    return newLead;
  }

  public updateLeadStatus(leadId: string, status: Lead['status']) {
    const lead = this.data.leads.find((l) => l.id === leadId);
    if (lead) {
      lead.status = status;

      pgDb.update(schema.leads)
        .set({ status })
        .where(eq(schema.leads.id, leadId))
        .catch((e) => console.error('Error update lead status:', e));

      this.save();
    }
  }

  // --- Conversations ---
  public getConversations(tenantId: string): Conversation[] {
    return this.data.conversations.filter((c) => c.tenant_id === tenantId);
  }

  public async getOrCreateConversation(tenantId: string, customerId: string, channel: Conversation['channel']): Promise<Conversation> {
    let conv = this.data.conversations.find((c) => c.tenant_id === tenantId && c.customer_id === customerId && c.channel === channel);
    if (!conv) {
      conv = {
        id: this.generateId('conv'),
        tenant_id: tenantId,
        customer_id: customerId,
        channel,
        last_message: '',
        updated_at: new Date().toISOString(),
        status: 'active'
      };
      this.data.conversations.push(conv);

      try {
        await pgDb.insert(schema.conversations).values(mapConversationToRow(conv));
      } catch (e) {
        console.error('Error insert conversation:', e);
      }

      this.save();
    }
    return conv;
  }

  public closeConversation(convId: string) {
    const conv = this.data.conversations.find((c) => c.id === convId);
    if (conv) {
      conv.status = 'resolved';

      pgDb.update(schema.conversations)
        .set({ status: 'resolved' })
        .where(eq(schema.conversations.id, convId))
        .catch((e) => console.error('Error closing conversation:', e));

      this.save();
    }
  }

  // --- Messages ---
  public getMessages(convId: string): Message[] {
    return this.data.messages.filter((m) => m.conversation_id === convId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public async addMessage(convId: string, sender: Message['sender'], content: string, metadata?: any): Promise<Message> {
    const newMsg: Message = {
      id: this.generateId('m'),
      conversation_id: convId,
      sender,
      content,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.data.messages.push(newMsg);

    try {
      await pgDb.insert(schema.messages).values(mapMessageToRow(newMsg));
    } catch (e) {
      console.error('Error inserts message:', e);
    }

    const conv = this.data.conversations.find((c) => c.id === convId);
    if (conv) {
      conv.last_message = content;
      conv.updated_at = new Date().toISOString();

      try {
        await pgDb.update(schema.conversations)
          .set({ lastMessage: content, updatedAt: conv.updated_at })
          .where(eq(schema.conversations.id, convId));
      } catch (e) {
        console.error('Error update conversation last message:', e);
      }
    }

    this.save();
    return newMsg;
  }

  // --- Knowledge Base ---
  public getKBItems(tenantId: string): KnowledgeBaseItem[] {
    return this.data.knowledgeBase.filter((k) => k.tenant_id === tenantId);
  }

  public addKBItem(tenantId: string, name: string, type: KnowledgeBaseItem['type'], text: string, chunkCount: number, url?: string): KnowledgeBaseItem {
    const item: KnowledgeBaseItem = {
      id: this.generateId('kb'),
      tenant_id: tenantId,
      name,
      type,
      text_preview: text,
      chunk_count: chunkCount,
      content_url: url,
      created_at: new Date().toISOString()
    };
    this.data.knowledgeBase.push(item);

    pgDb.insert(schema.kbItems).values(mapKBToRow(item))
      .catch((e) => console.error('Error inserts kbItems:', e));

    this.save();
    return item;
  }

  public deleteKBItem(itemId: string) {
    this.data.knowledgeBase = this.data.knowledgeBase.filter((k) => k.id !== itemId);

    pgDb.delete(schema.kbItems)
      .where(eq(schema.kbItems.id, itemId))
      .catch((e) => console.error('Error deletes kb item:', e));

    this.save();
  }

  // --- Workflows ---
  public getWorkflows(tenantId: string): Workflow[] {
    return this.data.workflows.filter((w) => w.tenant_id === tenantId);
  }

  public createWorkflow(tenantId: string, name: string, triggerEvent: string, nodes: any[], edges: any[]): Workflow {
    const w: Workflow = {
      id: this.generateId('w'),
      tenant_id: tenantId,
      name,
      trigger_event: triggerEvent,
      nodes,
      edges,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.data.workflows.push(w);

    pgDb.insert(schema.workflows).values(mapWorkflowToRow(w))
      .catch((e) => console.error('Error insert workflow:', e));

    this.save();
    return w;
  }

  public updateWorkflow(wId: string, uNodes: any[], uEdges: any[], isActive?: boolean) {
    const w = this.data.workflows.find((x) => x.id === wId);
    if (w) {
      w.nodes = uNodes;
      w.edges = uEdges;
      if (isActive !== undefined) w.is_active = isActive;

      pgDb.update(schema.workflows)
        .set({
          nodes: uNodes,
          edges: uEdges,
          ...(isActive !== undefined ? { isActive } : {})
        })
        .where(eq(schema.workflows.id, wId))
        .catch((e) => console.error('Error update workflows:', e));

      this.save();
    }
  }

  // --- Delivery Orders ---
  public getOrders(tenantId: string): Order[] {
    return this.data.orders.filter((o) => o.tenant_id === tenantId);
  }

  public createOrder(tenantId: string, customerId: string, pickup: string, dropoff: string, pkg: string, dist: number, dur: number, fare: number): Order {
    const riders = this.getRiders(tenantId).filter((r) => r.status === 'available');
    const riderId = riders.length > 0 ? riders[0].id : null;

    if (riderId) {
      const r = this.data.riders.find((x) => x.id === riderId);
      if (r) {
        r.status = 'busy';
        pgDb.update(schema.riders)
          .set({ status: 'busy' })
          .where(eq(schema.riders.id, riderId))
          .catch((e) => console.error('Error update rider status:', e));
      }
    }

    const o: Order = {
      id: this.generateId('o'),
      tenant_id: tenantId,
      customer_id: customerId,
      pickup_address: pickup,
      dropoff_address: dropoff,
      package_details: pkg,
      distance_km: parseFloat(dist.toFixed(2)),
      duration_mins: Math.ceil(dur),
      fare_ugx: Math.ceil(fare),
      status: riderId ? 'assigned' : 'pending',
      rider_id: riderId,
      created_at: new Date().toISOString()
    };
    this.data.orders.push(o);

    pgDb.insert(schema.orders).values(mapOrderToRow(o))
      .catch((e) => console.error('Error insert order:', e));

    this.save();
    return o;
  }

  public updateOrderStatus(orderId: string, status: Order['status'], riderId?: string | null) {
    const o = this.data.orders.find((x) => x.id === orderId);
    if (o) {
      const prevStatus = o.status;

      o.status = status;
      if (riderId !== undefined) o.rider_id = riderId;

      if (status === 'completed' || status === 'cancelled') {
        if (o.rider_id) {
          const r = this.data.riders.find((x) => x.id === o.rider_id);
          if (r) {
            r.status = 'available';
            pgDb.update(schema.riders)
              .set({ status: 'available' })
              .where(eq(schema.riders.id, o.rider_id))
              .catch((e) => console.error('Error update rider status:', e));
          }
        }
      } else if (status === 'assigned' && prevStatus === 'pending') {
        if (o.rider_id) {
          const r = this.data.riders.find((x) => x.id === o.rider_id);
          if (r) {
            r.status = 'busy';
            pgDb.update(schema.riders)
              .set({ status: 'busy' })
              .where(eq(schema.riders.id, o.rider_id))
              .catch((e) => console.error('Error update rider status:', e));
          }
        }
      }

      pgDb.update(schema.orders)
        .set({
          status,
          ...(riderId !== undefined ? { riderId } : {})
        })
        .where(eq(schema.orders.id, orderId))
        .catch((e) => console.error('Error update order status:', e));

      this.save();
    }
  }

  // --- Riders ---
  public getRiders(tenantId: string): Rider[] {
    return this.data.riders.filter((r) => r.tenant_id === tenantId);
  }

  public createRider(tenantId: string, name: string, phone: string): Rider {
    const r: Rider = {
      id: this.generateId('r'),
      tenant_id: tenantId,
      name,
      phone,
      status: 'available',
      latitude: 0.3150 + (Math.random() - 0.5) * 0.04,
      longitude: 32.5850 + (Math.random() - 0.5) * 0.04,
      created_at: new Date().toISOString()
    };
    this.data.riders.push(r);

    pgDb.insert(schema.riders).values(mapRiderToRow(r))
      .catch((e) => console.error('Error insert rider:', e));

    this.save();
    return r;
  }

  public updateRiderLocation(riderId: string, lat: number, lng: number) {
    const r = this.data.riders.find((x) => x.id === riderId);
    if (r) {
      r.latitude = lat;
      r.longitude = lng;

      pgDb.update(schema.riders)
        .set({ latitude: lat, longitude: lng })
        .where(eq(schema.riders.id, riderId))
        .catch((e) => console.error('Error updates rider coordinates:', e));
    }
  }

  // --- Payments / Billing ---
  public getPayments(tenantId: string): Payment[] {
    return this.data.payments.filter((p) => p.tenant_id === tenantId);
  }

  public paySubscription(tenantId: string, amount: number, method: Payment['method']): Payment {
    const ref = `REF-${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const pay: Payment = {
      id: this.generateId('p'),
      tenant_id: tenantId,
      amount,
      currency: 'UGX',
      method,
      status: 'success',
      reference: ref,
      created_at: new Date().toISOString()
    };
    this.data.payments.push(pay);

    pgDb.insert(schema.payments).values(mapPaymentToRow(pay))
      .catch((e) => console.error('Error inserts payments:', e));

    const tenant = this.getTenant(tenantId);
    if (tenant) {
      tenant.subscription_status = 'active';
      let plan: SubscriptionPlan = 'starter';
      if (amount >= 500000) {
        plan = 'enterprise';
      } else if (amount >= 150000) {
        plan = 'professional';
      }
      tenant.subscription_plan = plan;

      pgDb.update(schema.tenants)
        .set({
          subscriptionStatus: 'active',
          subscriptionPlan: plan
        })
        .where(eq(schema.tenants.tenantId, tenantId))
        .catch((e) => console.error('Error updates tenant subscription status:', e));
    }

    this.save();
    return pay;
  }

  // --- System KPI Metrics Analytics ---
  public getSystemAnalytics(): AnalyticsSummary {
    const totalTenants = this.data.tenants.length;
    let totalRevenue = 0;
    this.data.payments.forEach((p) => {
      if (p.status === 'success') totalRevenue += p.amount;
    });

    const totalConversations = this.data.conversations.length;
    const channels = { whatsapp: 0, telegram: 0, webchat: 0, sms: 0, email: 0 };
    this.data.conversations.forEach((c) => {
      if (channels[c.channel] !== undefined) {
        channels[c.channel]++;
      }
    });

    const indCount: { [key in IndustryType]?: number } = {};
    this.data.tenants.forEach((t) => {
      indCount[t.industry_type] = (indCount[t.industry_type] || 0) + 1;
    });

    const apiCallsCount = (this.data.messages.length * 12) + 1342;

    return {
      total_tenants: totalTenants,
      total_revenue_ugx: totalRevenue,
      ai_api_calls: apiCallsCount,
      active_customers: this.data.customers.length,
      active_conversations: totalConversations,
      total_orders: this.data.orders.length,
      total_leads: this.data.leads.length,
      conversations_by_channel: channels,
      by_industry: indCount
    };
  }
}

export const db = new SimulatedDB();
