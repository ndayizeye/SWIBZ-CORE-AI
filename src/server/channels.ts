/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { runAICoreEngine } from './ai.js';
import { Conversation } from '../types.js';

export const channelsRouter = Router();

// Reusable handler to process inbound messaging from any channel
async function processInboundChannelMessage(
  tenantId: string,
  channel: Conversation['channel'],
  phone: string,
  senderName: string,
  email: string,
  messageContent: string,
  res: Response
) {
  try {
    // 1. Resolve customer
    const customer = await db.getOrCreateCustomer(tenantId, senderName, phone, email);

    // 2. Resolve/Create conversation for this customer on this specific channel
    const conversation = await db.getOrCreateConversation(tenantId, customer.id, channel);

    // Check if customer is coming back to a resolved conversation
    const isCustomerComingBack = conversation.status === 'resolved';

    // Ensure conversation is reactivated
    if (conversation.status === 'resolved') {
      conversation.status = 'active';
      db.save();
    }

    // 3. Log inbound customer message
    await db.addMessage(conversation.id, 'customer', messageContent);

    // 4. Trigger SWIBZ AI Core engine execution (NLP, RAG, function call solvers)
    const aiResult = await runAICoreEngine(tenantId, customer.id, messageContent, isCustomerComingBack);

    // 5. Log AI Core responses
    const aiMessage = await db.addMessage(conversation.id, 'ai', aiResult.reply, {
      tool_calls: aiResult.toolCalls,
      workflow_triggered: aiResult.workflowTriggered,
      rag_references: aiResult.ragReferences
    });

    // 6. Return response
    return res.status(200).json({
      success: true,
      message_id: aiMessage.id,
      conversation_id: conversation.id,
      customer: {
        id: customer.id,
        name: customer.name,
        lead_score: customer.lead_score
      },
      ai_response: {
        reply: aiResult.reply,
        tool_calls: aiResult.toolCalls,
        workflow_triggered: aiResult.workflowTriggered
      }
    });

  } catch (error: any) {
    console.error(`Error processing channel inbound message (${channel}):`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'AIService failed to respond to the request.'
    });
  }
}

// WhatsApp Connector Webhook
// POST /api/channels/whatsapp/webhook
channelsRouter.post('/whatsapp/webhook', async (req: Request, res: Response) => {
  const { tenant_id, phone, sender_name, message } = req.body;

  if (!tenant_id || !phone || !message) {
    return res.status(400).json({ error: 'Missing parameters. WhatsApp payload requires tenant_id, phone, matches.' });
  }

  const name = sender_name || `WhatsApp User ${phone.slice(-4)}`;
  return processInboundChannelMessage(tenant_id, 'whatsapp', phone, name, '', message, res);
});

// Telegram Connector Webhook
// POST /api/channels/telegram/webhook
channelsRouter.post('/telegram/webhook', async (req: Request, res: Response) => {
  const { tenant_id, telegram_user_id, first_name, username, message } = req.body;

  if (!tenant_id || !telegram_user_id || !message) {
    return res.status(400).json({ error: 'Missing parameters. Telegram webhook requires tenant_id, telegram_user_id, message.' });
  }

  const phone = `TG-${telegram_user_id}`;
  const name = first_name || username || `Telegram User ${telegram_user_id}`;
  const email = username ? `${username.toLowerCase()}@telegram.com` : '';

  return processInboundChannelMessage(tenant_id, 'telegram', phone, name, email, message, res);
});

// Website Chat Message Connector
// POST /api/channels/webchat/message
channelsRouter.post('/webchat/message', async (req: Request, res: Response) => {
  const { tenant_id, session_id, customer_name, message, phone, email } = req.body;

  if (!tenant_id || !session_id || !message) {
    return res.status(400).json({ error: 'Missing parameters. Webchat requires tenant_id, session_id (which acts as unique reference ID), message.' });
  }

  const custPhone = phone || `WC-${session_id.slice(-6)}`;
  const name = customer_name || `Web visitor ${session_id.slice(-4)}`;
  const custEmail = email || '';

  return processInboundChannelMessage(tenant_id, 'webchat', custPhone, name, custEmail, message, res);
});

// SMS Connector Webhook
// POST /api/channels/sms/webhook
channelsRouter.post('/sms/webhook', async (req: Request, res: Response) => {
  const { tenant_id, sender_phone, text } = req.body;

  if (!tenant_id || !sender_phone || !text) {
    return res.status(400).json({ error: 'SMS webhook requires tenant_id, sender_phone, text.' });
  }

  const name = `SMS User ${sender_phone.slice(-4)}`;
  return processInboundChannelMessage(tenant_id, 'sms', sender_phone, name, '', text, res);
});

// Email Connector Webhook
// POST /api/channels/email/webhook
channelsRouter.post('/email/webhook', async (req: Request, res: Response) => {
  const { tenant_id, from_email, from_name, subject, body } = req.body;

  if (!tenant_id || !from_email || !body) {
    return res.status(400).json({ error: 'Email connector requires tenant_id, from_email, body.' });
  }

  const name = from_name || from_email.split('@')[0];
  const phone = `EM-${from_email.replace(/[@.]/g, '')}`;
  const completeText = `Subject: ${subject || 'Inquiry'}\n\n${body}`;

  return processInboundChannelMessage(tenant_id, 'email', phone, name, from_email, completeText, res);
});
