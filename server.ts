/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.js';
import { channelsRouter } from './src/server/channels.js';
import { learnFromConversations, learnFromInternet } from './src/server/ai.js';
import { IndustryType, SubscriptionPlan } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit expanded for document chunk uploads
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES FIRST ---

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server_time: new Date().toISOString() });
  });

  // Fetch Super Admin KPIs Snapshots
  app.get('/api/admin/analytics', (req, res) => {
    try {
      const summary = db.getSystemAnalytics();
      const tenants = db.getTenants();
      res.json({ success: true, summary, tenants });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get current system tenants list
  app.get('/api/tenants', (req, res) => {
    res.json(db.getTenants());
  });

  // Create a new tenant setup (Onboarding)
  app.post('/api/tenants', async (req, res) => {
    const { company_name, industry_type, plan, preload_templates } = req.body;
    if (!company_name || !industry_type) {
      return res.status(400).json({ error: 'Company Name and Industry Type are required.' });
    }
    try {
      const isPreload = preload_templates !== false;
      const newTenant = await db.createTenant(company_name, industry_type as IndustryType, (plan || 'starter') as SubscriptionPlan, isPreload);
      // Create owner user
      await db.createUser(newTenant.tenant_id, `Manager of ${company_name}`, `owner@${company_name.toLowerCase().replace(/\s+/g, '')}.com`, 'business_owner');

      res.status(201).json({ success: true, tenant: newTenant });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Fetch complete business metadata and collections isolated by tenancy
  const handleTenantGet = (req: express.Request, res: express.Response) => {
    const tenantId = req.params.id;
    const tenant = db.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: `Tenant ${tenantId} not registered.` });
    }

    try {
      const customers = db.getCustomers(tenantId);
      const leads = db.getLeads(tenantId);
      const conversations = db.getConversations(tenantId);
      const workflows = db.getWorkflows(tenantId);
      const kbItems = db.getKBItems(tenantId);
      const orders = db.getOrders(tenantId);
      const riders = db.getRiders(tenantId);
      const payments = db.getPayments(tenantId);

      res.json({
        success: true,
        tenant,
        customers,
        leads,
        conversations,
        workflows,
        kbItems,
        knowledge: kbItems, // alias knowledge to kbItems for dashboard compatibility
        orders,
        riders,
        payments
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  app.get('/api/tenant/:id', handleTenantGet);
  app.get('/api/tenant/:id/dashboard', handleTenantGet);

  // Fetch messages of specific conversation
  app.get('/api/conversation/:id/messages', (req, res) => {
    const convId = req.params.id;
    try {
      const messages = db.getMessages(convId);
      res.json({ success: true, messages });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Dynamic Industry Templates Management (CRUD) ---
  app.get('/api/admin/industry-templates', (req, res) => {
    try {
      res.json({ success: true, templates: db.getIndustryTemplates() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/industry-templates', (req, res) => {
    try {
      const template = req.body;
      if (!template.name) {
        return res.status(400).json({ error: 'Template corporate name is required.' });
      }
      const added = db.addIndustryTemplate(template);
      res.status(201).json({ success: true, template: added });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/industry-templates/:id', (req, res) => {
    const { id } = req.params;
    try {
      const updated = db.updateIndustryTemplate(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: `Template ${id} not found.` });
      }
      res.json({ success: true, template: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/industry-templates/:id', (req, res) => {
    const { id } = req.params;
    try {
      db.deleteIndustryTemplate(id);
      res.json({ success: true, message: `Industry template ${id} deleted successfully.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Tenant Brand and Contact Profile Customization ---
  app.put('/api/tenant/:id/profile', (req, res) => {
    const { id } = req.params;
    try {
      const updated = db.updateTenant(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: `Tenant ${id} not registered.` });
      }
      res.json({ success: true, tenant: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Close conversation
  app.post('/api/conversation/:id/resolve', async (req, res) => {
    try {
      const conv = db.getConversation(req.params.id);
      db.closeConversation(req.params.id);
      
      if (conv) {
        // Automatically learn/mine from successful conversations in the background to build the knowledge base
        learnFromConversations(conv.tenant_id).catch((err) => {
          console.error('Error auto-learning from resolved conversation:', err);
        });
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update lead state
  app.post('/api/lead/:id/status', (req, res) => {
    const { status } = req.body;
    try {
      db.updateLeadStatus(req.params.id, status);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Visual workflows designer updates
  app.post('/api/tenant/:id/workflows', (req, res) => {
    const tenantId = req.params.id;
    const { name, trigger_event, nodes, edges } = req.body;

    if (!name || !trigger_event) {
      return res.status(400).json({ error: 'Missing name or trigger_event values.' });
    }

    try {
      const workflow = db.createWorkflow(tenantId, name, trigger_event, nodes || [], edges || []);
      res.status(201).json({ success: true, workflow });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/workflow/:id', (req, res) => {
    const { nodes, edges, is_active } = req.body;
    try {
      db.updateWorkflow(req.params.id, nodes, edges, is_active);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Knowledge base document uploads simulation
  app.post('/api/tenant/:id/knowledge', (req, res) => {
    const tenantId = req.params.id;
    const { name, type, text_preview, chunk_count, url } = req.body;

    if (!name || !text_preview) {
      return res.status(400).json({ error: 'Name and document texts must be supplied.' });
    }

    try {
      const kb = db.addKBItem(tenantId, name, type || 'txt', text_preview, chunk_count || 1, url);
      res.status(201).json({ success: true, item: kb });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Learn from previous conversations
  app.post('/api/tenant/:id/knowledge/learn-conversations', async (req, res) => {
    const tenantId = req.params.id;
    try {
      const result = await learnFromConversations(tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Learn from the internet via search grounding
  app.post('/api/tenant/:id/knowledge/learn-internet', async (req, res) => {
    const tenantId = req.params.id;
    const { searchTopic } = req.body;
    if (!searchTopic || !searchTopic.trim()) {
      return res.status(400).json({ error: 'searchTopic parameter is required.' });
    }
    try {
      const result = await learnFromInternet(tenantId, searchTopic);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/knowledge/:id', (req, res) => {
    try {
      db.deleteKBItem(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delivery module orders dispatcher updates
  app.post('/api/order/:id/status', (req, res) => {
    const { status, rider_id } = req.body;
    try {
      db.updateOrderStatus(req.params.id, status, rider_id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Support direct orders dispatching from estimation results
  app.post('/api/tenant/:id/order', async (req, res) => {
    const tenantId = req.params.id;
    const { pickup_address, dropoff_address, package_details, fare_ugx } = req.body;
    if (!pickup_address || !dropoff_address) {
      return res.status(400).json({ error: 'Pickup and Dropoff addresses are required.' });
    }
    try {
      // Find default customer or create one
      const customers = db.getCustomers(tenantId);
      let customerId = customers.length > 0 ? customers[0].id : '';
      if (!customerId) {
        const c = await db.getOrCreateCustomer(tenantId, 'Walk-In Dispatch', '+256700000000', 'dispatch@walkin.com');
        customerId = c.id;
      }
      const order = db.createOrder(
        tenantId,
        customerId,
        pickup_address,
        dropoff_address,
        package_details || 'Quick dispatch multi-stop order',
        12.5,
        30,
        fare_ugx || 15000
      );
      res.status(201).json({ success: true, order });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Support creating rider
  app.post('/api/tenant/:id/rider', (req, res) => {
    const tenantId = req.params.id;
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Rider Name and Phone are required.' });
    }
    try {
      const rider = db.createRider(tenantId, name, phone);
      res.status(201).json({ success: true, rider });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Simulated subscription billing gateway (Mobile Money & Stripe)
  app.post('/api/tenant/:id/pay', (req, res) => {
    const tenantId = req.params.id;
    const { amount, method } = req.body; // method: 'mtn_momo' | 'airtel_money' | 'stripe'

    if (!amount || !method) {
      return res.status(400).json({ error: 'Amount and Payment Method are required.' });
    }

    try {
      const payment = db.paySubscription(tenantId, Number(amount), method);
      res.status(200).json({
        success: true,
        payment,
        status: tenantId ? 'active' : 'trial',
        message: 'Payment verified and subscription status activated successfully.'
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- CHANNEL CONNECTORS ROUTER DELEGATES ---
  app.use('/api/channels', channelsRouter);


  // --- BIND INTEGRATIONS & WEB ASSETS IN EXPRESS ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Swibz AI Core Server running or listening on port ${PORT}`);
  });
}

startServer();
