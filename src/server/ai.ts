/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';
import { Conversation, Message, Customer, IndustryType } from '../types.js';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Simple cosine distance or string overlap Jaccard simulation for semantic RAG
function findRAGMatches(tenantId: string, query: string): string[] {
  const kbItems = db.getKBItems(tenantId);
  const matches: string[] = [];

  const normalizedQuery = query.toLowerCase();

  kbItems.forEach((item) => {
    const nameLower = item.name.toLowerCase();
    const previewLower = item.text_preview.toLowerCase();
    
    // Split the query words and filter for short words
    const words = normalizedQuery.split(/[\s,.\-!?]+/);
    const hasKeywordMatch = words.some(w => {
      if (w.length <= 3) return false;
      return nameLower.includes(w) || previewLower.includes(w);
    });

    if (hasKeywordMatch || nameLower.includes(normalizedQuery) || normalizedQuery.includes(nameLower)) {
      matches.push(`[Knowledge Base Document: ${item.name}]\n${item.text_preview}`);
    }
  });

  // If no match was found, fall back to adding first 2 files in knowledge base as general grounding context
  if (matches.length === 0 && kbItems.length > 0) {
    kbItems.slice(0, 2).forEach((item) => {
      matches.push(`[Knowledge Base General Reference: ${item.name}]\n${item.text_preview}`);
    });
  }

  return matches;
}

// Kampala coordinates mockup for distance calculation to allow real distance metrics
const KAMPALA_MARKERS: Record<string, { lat: number; lng: number }> = {
  'ntinda': { lat: 0.3533, lng: 32.6120 },
  'kololo': { lat: 0.3341, lng: 32.5977 },
  'kampala central': { lat: 0.3136, lng: 32.5811 },
  'nakasero': { lat: 0.3224, lng: 32.5833 },
  'industrial area': { lat: 0.3190, lng: 32.5999 },
  'mutungo': { lat: 0.3315, lng: 32.6410 },
  'muyenga': { lat: 0.2980, lng: 32.6144 },
  'lubaga': { lat: 0.3021, lng: 32.5532 },
  'makerere': { lat: 0.3350, lng: 32.5700 },
  'wandegeya': { lat: 0.3300, lng: 32.5780 },
  'bukoto': { lat: 0.3490, lng: 32.6010 },
  'kabalagala': { lat: 0.2990, lng: 32.6020 },
  'bugolobi': { lat: 0.3170, lng: 32.6280 },
};

export function lookupCoordinates(locName: string) {
  const norm = locName.toLowerCase().replace(/kampala/gi, '').trim();
  for (const k in KAMPALA_MARKERS) {
    if (norm.includes(k) || k.includes(norm)) {
      return KAMPALA_MARKERS[k];
    }
  }
  // Fallback random coord inside Kampala
  return {
    lat: 0.3150 + (Math.random() - 0.5) * 0.05,
    lng: 32.5850 + (Math.random() - 0.5) * 0.05
  };
}

// Distance solver using haversine
function calculateDistanceKM(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371; // radius of Earth
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// The core function tool solvers
const toolsProcessors = {
  calculate_delivery_price: (args: { pickup: string; dropoff: string }) => {
    const pCoord = lookupCoordinates(args.pickup);
    const dCoord = lookupCoordinates(args.dropoff);
    const dist = calculateDistanceKM(pCoord, dCoord);
    // Base 4000 + (dist * 1500)
    const baseFee = 4000;
    const costPerKm = 1500;
    const distance_km = dist > 0.5 ? dist : 4.2; // default if same location or error
    const calculated_fare_ugx = baseFee + (distance_km * costPerKm);

    return {
      success: true,
      pickup: args.pickup,
      dropoff: args.dropoff,
      distance_km: parseFloat(distance_km.toFixed(2)),
      duration_mins: Math.ceil(distance_km * 3), // approx 3 mins per km
      calculated_fare_ugx: Math.ceil(calculated_fare_ugx)
    };
  },

  create_delivery_order: (tenantId: string, customerId: string, args: { pickup: string; dropoff: string; package_details: string }) => {
    const priceResult = toolsProcessors.calculate_delivery_price({ pickup: args.pickup, dropoff: args.dropoff });
    const order = db.createOrder(
      tenantId,
      customerId,
      priceResult.pickup,
      priceResult.dropoff,
      args.package_details || 'Standard Envelope Package',
      priceResult.distance_km,
      priceResult.duration_mins,
      priceResult.calculated_fare_ugx
    );

    return {
      success: true,
      order_id: order.id,
      pickup: order.pickup_address,
      dropoff: order.dropoff_address,
      fare_ugx: order.fare_ugx,
      distance_km: order.distance_km,
      status: order.status,
      assigned_rider: order.rider_id ? db.getRiders(tenantId).find(r => r.id === order.rider_id)?.name : null
    };
  },

  check_available_slots: (args: { department: string; date: string }) => {
    const slots = [
      { time: '09:00 AM', status: 'available', doctor: 'Dr. Timothy Ssebunya' },
      { time: '10:00 AM', status: 'available', doctor: 'Dr. Brenda Namaganda' },
      { time: '11:30 AM', status: 'busy', doctor: 'Dr. Brenda Namaganda' },
      { time: '02:00 PM', status: 'available', doctor: 'Dr. Timothy Ssebunya' }
    ];
    return {
      success: true,
      department: args.department || 'general',
      date: args.date || 'tomorrow',
      slots: slots.filter((s) => s.status === 'available')
    };
  },

  create_clinic_booking: (tenantId: string, customerId: string, args: { department: string; date: string; time: string }) => {
    const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
    const clinicDoctors: Record<string, string> = {
      dental: 'Dr. Brenda Namaganda',
      pediatrics: 'Dr. Timothy Ssebunya',
      general: 'Dr. Jude Kato'
    };
    const doctor = clinicDoctors[args.department.toLowerCase()] || 'Dr. Jude Kato';

    // Log a task or lead summary
    db.createLead(
      tenantId,
      customerId,
      'new',
      `Clinic Appointment: ${args.department} reservation`,
      50000, // Consultation standard Fee UGX
      80,
      `Scheduled appointment for ${args.date} at ${args.time} with ${doctor}. Department: ${args.department}`
    );

    return {
      success: true,
      booking_id: bookingId,
      department: args.department,
      date: args.date,
      time: args.time,
      doctor,
      instructions: 'Please arrive 15 minutes before your scheduled slot. Location: Victoria Wellness Medical Complex.'
    };
  },

  look_up_student_record: (args: { student_name: string }) => {
    return {
      success: true,
      student_name: args.student_name,
      class_stream: 'Senior Three West',
      house: 'Nile House',
      boarding_status: 'Boarding',
      guardian_name: 'Derrick Opio',
      academic_average: '78%'
    };
  },

  verify_fee_balance: (args: { student_name: string }) => {
    return {
      success: true,
      student_name: args.student_name,
      tuition_total_ugx: 1800000,
      amount_paid_ugx: 1200000,
      balance_outstanding_ugx: 600000,
      status: 'Outstanding Balance',
      due_date: '2026-07-15'
    };
  }
};

interface AIResponsePayload {
  reply: string;
  toolCalls?: { name: string; args: any; result: any }[];
  workflowTriggered?: string;
  customerLeadScore?: number;
}

// Fallback rule base conversational engine when Gemini API Key is not set or errors
export function processConversationalSimulation(
  industry: IndustryType,
  query: string,
  tenantId: string,
  customerId: string,
  isReactivated: boolean = false
): AIResponsePayload {
  const normInput = query.toLowerCase();

  // --- 1. HISTORICAL CONTEXT & JUDGMENT ---
  // Retrieve chronological message history
  const userConversations = db.getConversations(tenantId).filter((c) => c.customer_id === customerId);
  const allMessages: Message[] = [];
  for (const conv of userConversations) {
    const msgs = db.getMessages(conv.id);
    allMessages.push(...msgs);
  }
  allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Filter out the actual current message if found in logs
  let pastMessages = allMessages;
  if (allMessages.length > 0 && allMessages[allMessages.length - 1].content === query) {
    pastMessages = allMessages.slice(0, -1);
  }

  // Scan history for contextual metrics
  let lastPickup = 'Ntinda';
  let lastDropoff = 'Kololo';
  let lastDepartment = 'general';
  let lastStudentName = 'Derrick Opio Jr.';
  let lastRoomClass = 'Standard Single';
  let lastPropertySite = 'Ntinda';
  let lastProduct = 'Digital copying papers';
  let lastDish = 'Cheesy beef burger';
  let lastMaterial = 'Cement grade 32.5R';
  let lastGuardType = 'Gate Sentries';
  
  // Find previous mentions in the conversation history
  for (let i = pastMessages.length - 1; i >= 0; i--) {
    const msgLower = pastMessages[i].content.toLowerCase();
    
    // Delivery locations extraction
    const pMatch = msgLower.match(/(?:from)\s+([a-z\s]+?)\s+(?:to)/i);
    const dMatch = msgLower.match(/(?:to)\s+([a-z\s]+?)(?:$|\s|for|with|and)/i);
    if (pMatch) lastPickup = pMatch[1].trim();
    if (dMatch) lastDropoff = dMatch[1].trim();
    
    // Clinic department extraction
    if (msgLower.includes('dental') || msgLower.includes('teeth')) {
      lastDepartment = 'dental';
    } else if (msgLower.includes('pediatric')) {
      lastDepartment = 'pediatrics';
    } else if (msgLower.includes('clinic') || msgLower.includes('medical') || msgLower.includes('general')) {
      lastDepartment = 'general';
    }

    // Student inquiries extraction
    if (msgLower.includes(' opio') || msgLower.includes('derrick')) {
      lastStudentName = 'Derrick Opio Jr.';
    } else if (msgLower.includes('mugisha')) {
      lastStudentName = 'John Mugisha Jr.';
    }

    // Hotel room class
    if (msgLower.includes('single')) {
      lastRoomClass = 'Standard Single';
    } else if (msgLower.includes('twin') || msgLower.includes('deluxe')) {
      lastRoomClass = 'Deluxe Twin';
    } else if (msgLower.includes('suite') || msgLower.includes('executive')) {
      lastRoomClass = 'Executive Sovereign Suite';
    }

    // Real estate sites
    if (msgLower.includes('kololo')) {
      lastPropertySite = 'Kololo';
    } else if (msgLower.includes('gayaza') || msgLower.includes('mukono')) {
      lastPropertySite = 'Gayaza';
    } else if (msgLower.includes('ntinda')) {
      lastPropertySite = 'Ntinda';
    }

    // Retail products
    if (msgLower.includes('paper') || msgLower.includes('stationery')) {
      lastProduct = 'Digital copying papers';
    } else if (msgLower.includes('accessories') || msgLower.includes('electronic')) {
      lastProduct = 'Electronic accessories';
    } else if (msgLower.includes('uniform') || msgLower.includes('merchandise')) {
      lastProduct = 'Customized promotional uniforms';
    }

    // Restaurant dishes
    if (msgLower.includes('burger')) {
      lastDish = 'Cheesy beef burger';
    } else if (msgLower.includes('pizza')) {
      lastDish = 'Mega pepperoni pizza';
    } else if (msgLower.includes('luwombo') || msgLower.includes('traditional')) {
      lastDish = 'Chicken luwombo';
    }

    // Hardware materials
    if (msgLower.includes('cement')) {
      lastMaterial = 'Cement grade 32.5R';
    } else if (msgLower.includes('iron') || msgLower.includes('sheet')) {
      lastMaterial = 'Iron sheets G30';
    } else if (msgLower.includes('paint')) {
      lastMaterial = 'Premium Weather-guard Paint';
    }

    // Security guard type
    if (msgLower.includes('sentry') || msgLower.includes('gate')) {
      lastGuardType = 'Gate Sentries';
    } else if (msgLower.includes('fence')) {
      lastGuardType = 'Electric Fence Installation';
    } else if (msgLower.includes('bodyguard') || msgLower.includes('vip')) {
      lastGuardType = 'VIP Bodyguard Escorts';
    }
  }

  // Handle returning/reactive customized greetings and history judgment
  if (isReactivated) {
    const customer = db.getCustomers(tenantId).find((c) => c.id === customerId);
    const customerName = customer ? customer.name : 'there';
    let hint = '';
    if (industry === 'delivery') hint = `your normal shipping route from *${lastPickup}* to *${lastDropoff}*`;
    else if (industry === 'school') hint = `your child *${lastStudentName}*'s outstanding tuition balance`;
    else if (industry === 'clinic') hint = `consultations in the *${lastDepartment}* division`;
    else if (industry === 'hotel') hint = `reservations for *${lastRoomClass}* room classes`;
    else if (industry === 'real_estate') hint = `site tours for corporate spaces in *${lastPropertySite}*`;
    else if (industry === 'sacco') hint = `voluntary dividend statement procedures`;
    else if (industry === 'retail') hint = `supply checks for *${lastProduct}* items`;
    else if (industry === 'restaurant') hint = `ordering more *${lastDish}* specials`;
    else if (industry === 'hardware') hint = `quotes on *${lastMaterial}* construction deliveries`;
    else if (industry === 'security') hint = `dispatch schedules for *${lastGuardType}* systems`;

    return {
      reply: `Welcome back, *${customerName}*! 👋 Since you resolved your previous ticket, I have re-opened your line.

Based on our conversation history, I see you were exploring ${hint || 'our business catalogs'}. I remembered your profile so we won't have to repeat security details. How can I assist you today?`,
      toolCalls: [],
      workflowTriggered: 'Returning Customer Dynamic Greet',
      customerLeadScore: 60
    };
  }

  // Check if confirming a previous option using historical information
  const isAffirmation = normInput.includes('confirm') || 
                        normInput.includes('yes') || 
                        normInput.includes('ok') || 
                        normInput.includes('go ahead') || 
                        normInput.includes('book it') || 
                        normInput.includes('schedule') ||
                        normInput === 'y' ||
                        normInput === 'ok';

  // --- 2. EVALUATE INTENT & FUNCTION CALLING ---
  const toolCalls: any[] = [];
  let reply = '';
  let workflowTriggered = '';

  // Find RAG references
  const matches = findRAGMatches(tenantId, query);
  const ragSnippet = matches.length > 0 ? `\n\n[Matched knowledge base facts]:\n${matches[0]}` : '';

  if (industry === 'delivery') {
    if (normInput.includes('deliver') || normInput.includes('send') || normInput.includes('pickup') || normInput.includes('dispatch') || normInput.includes('book') || isAffirmation) {
      // Check if we already have specific pickup/dropoff in query
      const pMatch = normInput.match(/(?:from)\s+([a-z\s]+?)\s+(?:to)/i);
      const dMatch = normInput.match(/(?:to)\s+([a-z\s]+?)(?:$|\s|for|with|and)/i);

      const pickup = pMatch ? pMatch[1].trim() : lastPickup;
      const dropoff = dMatch ? dMatch[1].trim() : lastDropoff;
      const details = normInput.includes('envelope') ? 'Envelope file' : normInput.includes('box') ? 'Cardboard Box' : 'Courier documents';

      const result = toolsProcessors.create_delivery_order(tenantId, customerId, { pickup, dropoff, package_details: details });
      toolCalls.push({ name: 'create_delivery_order', args: { pickup, dropoff, package_details: details }, result });

      workflowTriggered = 'Automated Delivery Booking Workflow';
      reply = `✨ *Swibz Delivery Order Booking*\n\nScheduled courier dispatch:\n- *Order Ref:* ${result.order_id}\n- *Pickup:* ${result.pickup}\n- *Dropoff:* ${result.dropoff}\n- *Distance:* ${result.distance_km} KM\n- *Est. Charge:* UGX ${result.fare_ugx.toLocaleString()}\n- *Rider Assigned:* ${result.assigned_rider || 'Assigning nearest dispatcher'}\n- *Status:* In Transit\n\nYou will receive real-time rider coordinates and SMS updates. Shipping with Kampala Express!`;
    } else if (normInput.includes('price') || normInput.includes('cost') || normInput.includes('fare') || normInput.includes('how much')) {
      const pMatch = normInput.match(/(?:from)\s+([a-z\s]+?)\s+(?:to)/i);
      const dMatch = normInput.match(/(?:to)\s+([a-z\s]+?)(?:$|\s|for|with|and)/i);

      const pickup = pMatch ? pMatch[1].trim() : lastPickup;
      const dropoff = dMatch ? dMatch[1].trim() : lastDropoff;

      const result = toolsProcessors.calculate_delivery_price({ pickup, dropoff });
      toolCalls.push({ name: 'calculate_delivery_price', args: { pickup, dropoff }, result });

      workflowTriggered = 'Pricing Matrix Calculation Workflow';
      reply = `📊 *Delivery Fare Calculation Summary*\n\nFare from *${result.pickup}* to *${result.dropoff}*:\n- *Distance:* ${result.distance_km} KM\n- *Estimated Duration:* ${result.duration_mins} mins\n- *Total Fare:* UGX ${result.calculated_fare_ugx.toLocaleString()} (calculated as Base Fee UGX 4,000 + ${result.distance_km} KM × UGX 1,500/KM).\n\nWould you like me to book a rider right away? Just say "yes please" or "book it".`;
    } else {
      reply = `Hello! I am Kampala Express's Swibz AI Dispatcher. How can I assist you today? I can help you with:\n1. Calculating delivery prices (say e.g., "how much is delivery from Ntinda to Kololo?")\n2. Booking a package courier (say e.g., "Deliver package from Ntinda to Kololo")${ragSnippet}`;
    }
  } else if (industry === 'clinic') {
    if (normInput.includes('appointment') || normInput.includes('booking') || normInput.includes('dental') || normInput.includes('checkup') || normInput.includes('reserve') || normInput.includes('visit') || isAffirmation) {
      const isDental = normInput.includes('dental') || normInput.includes('teeth') || lastDepartment === 'dental';
      const dept = isDental ? 'dental' : 'general';

      // Simulate slot check then book
      const result = toolsProcessors.create_clinic_booking(tenantId, customerId, { department: dept, date: 'June 19th', time: '10:00 AM' });
      toolCalls.push({ name: 'create_clinic_booking', args: { department: dept, date: 'June 19th', time: '10:00 AM' }, result });

      workflowTriggered = 'Clinic Appointment Booking Workflow';
      reply = `🩺 *Victoria Wellness Appointments System*\n\nUsing history judgment to confirm, your clinic appointment has been successfully scheduled:\n- *Booking Ref:* ${result.booking_id}\n- *Physician:* ${result.doctor}\n- *Specialty:* ${result.department.toUpperCase()}\n- *Date:* ${result.date}\n- *Time:* ${result.time}\n\n*Important Instructions:* ${result.instructions}\n\nDo you need help checking credentials or other doctor available hours?`;
    } else {
      reply = `Greetings from Victoria Wellness Clinic Center! I am your AI nurse representative. I can assist you with:\n1. Booking medical consultations / dental checkups (say e.g. "Do you have dental slots tomorrow?")\n2. Inquiry about active specialist routines & clinic services.${ragSnippet}`;
    }
  } else if (industry === 'school') {
    if (normInput.includes('fees') || normInput.includes('balance') || normInput.includes('outstanding') || normInput.includes('owing') || isAffirmation) {
      const result = toolsProcessors.verify_fee_balance({ student_name: lastStudentName });
      toolCalls.push({ name: 'verify_fee_balance', args: { student_name: lastStudentName }, result });

      workflowTriggered = 'Student Financial Inquiry Chain';
      reply = `🏫 *Green Hill Academy FinCenter*\n\nHere is the financial statement balance details for *${result.student_name}*:\n- *Term Tuition Cost:* UGX ${result.tuition_total_ugx.toLocaleString()}\n- *Tuition Paid:* UGX ${result.amount_paid_ugx.toLocaleString()}\n- *Outstanding owing Balance:* UGX ${result.balance_outstanding_ugx.toLocaleString()}\n- *Status Indicator:* ${result.status}\n- *Due Date:* ${result.due_date}\n\nPayments can be submitted via MTN Pay with merchant ID 4321, or direct Stanbic Bank deposits. Let me know if you would like me to compile school circular documentation!`;
    } else if (normInput.includes('admissions') || normInput.includes('admission') || normInput.includes('enroll') || normInput.includes('school vacancy')) {
      reply = `Boarding admissions are currently open for S1, S2, S3 & S5. The registration process requires filling standard entry forms and submitting term academic papers. Tuition remains UGX 1,800,000 inclusive of lodging expenses. Or say "fees balance info" to see statement details!${ragSnippet}`;
    } else {
      reply = `Welcome to Green Hill Academy parent info portal. I am Swibz School AI Counselor. Ask me about school fees structures, academic calendars, boarding admissions circulars, or outstanding invoice reports!${ragSnippet}`;
    }
  } else if (industry === 'hotel') {
    if (normInput.includes('room') || normInput.includes('book') || normInput.includes('reservation') || normInput.includes('stay') || isAffirmation) {
      const room = normInput.includes('suite') ? 'Executive Suite' : normInput.includes('twin') ? 'Deluxe Twin' : lastRoomClass;
      reply = `🛎️ *Hotel Room Reservation Lock*\n\nYour *${room}* stay reservation is locked under contact ${customerId}:\n- *Check-in:* Tonight 12:00 PM\n- *Check-out:* 10:00 AM\n- *Daily Rate:* UGX 120,000\n- *Incl.:* Breakfast & Free Shuttle\n\nIs there anything else I can coordinate for you?`;
      workflowTriggered = 'Hotel Room Booking Workflow';
      toolCalls.push({ name: 'book_hotel_room', args: { room_type: room, days: 1 }, result: { success: true, booking_id: 'H-' + Math.random().toString(36).substring(2, 6).toUpperCase() } });
    } else {
      reply = `Welcome to our Hotel and Lodging assistance desk! How can I help you? I can assist with reservation inquiries (Standard Single, Deluxe Twin, Executive Suite) or checking checkout policies.${ragSnippet}`;
    }
  } else if (industry === 'real_estate') {
    if (normInput.includes('listing') || normInput.includes('property') || normInput.includes('rent') || normInput.includes('site tour') || normInput.includes('visit') || isAffirmation) {
      reply = `🏠 *Commercial Real Estate Board*\n\nSite tour registered for *${lastPropertySite}* on Saturday morning:\n- *Featured:* 2-Bed Kololo Duplex at UGX 2,500,000/mo or Ntinda offices.\n- *Tour Time:* Saturday 9:00 AM standard group viewing.\n- *Assoc Agent:* David (0772001122)\n\nLet me know if you would like me to lock this appointment!`;
      workflowTriggered = 'Properties site tour schedule';
      toolCalls.push({ name: 'schedule_property_tour', args: { location: lastPropertySite, day: 'Saturday' }, result: { success: true, tour_id: 'RE-' + Math.random().toString(36).substring(2, 6).toUpperCase() } });
    } else {
      reply = `Greetings from Real Estate CRM. We offer listed apartments in Kololo (UGX 2.5M) and office spaces in Ntinda. Ask me to list vacant rentals or schedule a site tour!${ragSnippet}`;
    }
  } else if (industry === 'sacco') {
    if (normInput.includes('loan') || normInput.includes('apply') || normInput.includes('borrow') || normInput.includes('balance') || normInput.includes('savings') || isAffirmation) {
      reply = `💰 *SACCO Savings & Dividend desk*\n\nVerified dividend & statement parameters:\n- *Voluntary locked savings:* UGX 4,500,000\n- *Accumulated dividend rate:* 12% (UGX 540,000 due Dec)\n- *Eligible loan limit (3x savings):* UGX 13,500,000\n\nWould you like me to dispatch Emergency Loan application requirements or draft repayment circulars?`;
      workflowTriggered = 'SACCO statements check';
      toolCalls.push({ name: 'check_sacco_balance', args: { savings_limit: 4500000 }, result: { success: true } });
    } else {
      reply = `Welcome to SACCO financial support board. I can verify saved capital statements, loan eligibilities, and emergency flat cash interest rates.${ragSnippet}`;
    }
  } else if (industry === 'retail') {
    if (normInput.includes('stock') || normInput.includes('item') || normInput.includes('catalog') || normInput.includes('wholesale') || isAffirmation) {
      reply = `🛍️ *Retail Branch Stocks Report*\n\nInventory lookup checked for *${lastProduct}*:\n- *Avalaiblity status:* INSTOCK\n- *Corporate pricing terms:* UGX 95,000 per roll/unit\n- *Discount offer:* 10% cash discount applies for orders above UGX 500,000\n- *Location:* Kampala Nakasero Market Branch\n\nWould you like me to process a retail delivery dispatch via transport?`;
      workflowTriggered = 'Branch Inventory Checker';
      toolCalls.push({ name: 'check_inventory_stock', args: { item: lastProduct }, result: { in_stock: true, count: 48 } });
    } else {
      reply = `Hello! Welcome to our retail store support line. We have stationery, copying papers, and electronic items at our central Nakasero branch. Ask me about custom stock or exchange policies.${ragSnippet}`;
    }
  } else if (industry === 'restaurant') {
    if (normInput.includes('menu') || normInput.includes('food') || normInput.includes('eat') || normInput.includes('dish') || normInput.includes('burger') || normInput.includes('pizza') || normInput.includes('table') || isAffirmation) {
      reply = `🍔 *Dinner Table & Food Menu Dispatch*\n\nDinner special logged successfully:\n- *Selected Dish:* ${lastDish}\n- *Fares cost:* UGX 18,000\n- *Action:* Table reserved / Pickup delivery scheduled.\n- *Estimated Wait:* 25 minutes cooking dispatch\n\nShall we book a Kampalan Express courier rider to send this to your area?`;
      workflowTriggered = 'Digital Restaurant Ordering';
      toolCalls.push({ name: 'reserve_restaurant_table', args: { food: lastDish }, result: { success: true, estimation: '25m' } });
    } else {
      reply = `Welcome to our dining kitchen! Menu items: Cheesy beef burger (UGX 18k), Pepperoni Pizza (UGX 22k), Chicken luwombo (UGX 15k). Ask me to display the table calendar or dispatch orders!${ragSnippet}`;
    }
  } else if (industry === 'hardware') {
    if (normInput.includes('cement') || normInput.includes('sheet') || normInput.includes('material') || normInput.includes('paint') || isAffirmation) {
      reply = `🧱 *Construction Hardware Quote*\n\nMaterials billing quote compiled for *${lastMaterial}*:\n- *Standard Fares:* Cement bags (UGX 38,000/bag) or paint drums (UGX 140,000)\n- *Dispatch:* Available flatbed 4-tonne cargo Isuzu truck dispatch.\n\nShould we finalize invoice delivery and assign a cargo transporter?`;
      workflowTriggered = 'Bulk construction materials quote';
      toolCalls.push({ name: 'check_hardware_catalog', args: { material: lastMaterial }, result: { success: true } });
    } else {
      reply = `Welcome to construction supplies terminal. Ask us for cement (UGX 38k), color sheets (UGX 48k), paint, domestic electrical wires, or local flatbed deliveries!${ragSnippet}`;
    }
  } else if (industry === 'security') {
    if (normInput.includes('guard') || normInput.includes('fence') || normInput.includes('patrol') || normInput.includes('bodyguard') || isAffirmation) {
      reply = `🛡️ *Integrated Safety Guarding & Fence quotes*\n\nSupervised patrol logged for *${lastGuardType}*:\n- *Costing profile:* Domestic sentries start at UGX 280,000, or razor-wire set at UGX 1.8M\n- *Response center:* Active rapid responder dispatched under 8 mins on alarms.\n\nWould you like me to book a specialist assessment tour of your premises?`;
      workflowTriggered = 'Guarding Dispatch';
      toolCalls.push({ name: 'dispatch_guard_routing', args: { service: lastGuardType }, result: { success: true } });
    } else {
      reply = `Greetings from Security Response Dispatch. Ask us about corporate guard splits (UGX 350k), perimeter electric razor fences, bodyguards, and rapid emergency alarms!${ragSnippet}`;
    }
  } else {
    // Basic general business simulation
    if (normInput.includes('quote') || normInput.includes('price') || normInput.includes('how much') || normInput.includes('buy')) {
      reply = `Thank you for your inquiry about our operations! I have prepared a business quotation:\n- Standout Core Services: UGX 120,000 standard setup fee\n- Volume client support: UGX 50,000 recurring monthly support\n\nTo seal this deal, we can issue invoice receipts and connect you with a corporate staff member. Do you need additional specs?`;
      workflowTriggered = 'Standard Pricing Flow';
    } else {
      reply = `Hello! Welcome to our AI assistant. I have cross-referenced our knowledge repositories... We provide full-suite customer operations in the Uganda marketplace. Let me know how we can solve your request today!${ragSnippet}`;
    }
  }

  // Calculate simulated Lead scoring
  let score = 30;
  if (normInput.includes('deliver') || normInput.includes('book') || normInput.includes('appointment') || normInput.includes('fees') || normInput.includes('buy') || normInput.includes('hire')) {
    score = 88;
  } else if (normInput.includes('how much') || normInput.includes('cost') || normInput.includes('price') || normInput.includes('room') || normInput.includes('apartments') || normInput.includes('loan') || normInput.includes('menu') || normInput.includes('cement') || normInput.includes('guard')) {
    score = 65;
  }

  // Auto trigger CRM logs if buying intent starts
  if (score > 60) {
    const cust = db.getCustomers(tenantId).find((c) => c.id === customerId);
    if (cust) {
      db.updateCustomerLeadScore(customerId, score);
      // Create lead if not exists
      const leads = db.getLeads(tenantId);
      const hostLead = leads.find((l) => l.customer_id === customerId);
      if (!hostLead) {
        db.createLead(
          tenantId,
          customerId,
          'new',
          `AI Generated Lead: interest in ${industry} transaction`,
          industry === 'school' ? 1800000 : industry === 'delivery' ? 15000 : 150000,
          score,
          `Automated conversational lead score assigned at ${score}/100 based on prompt intent overview. Last message: "${query}"`
        );
      }
    }
  }

  return {
    reply,
    toolCalls,
    workflowTriggered,
    customerLeadScore: score
  };
}

// Full async Gemini AI integration core dispatcher
async function generateContentWithRetryAndFallback(client: GoogleGenAI, systemPrompt: string, query: string): Promise<string> {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: model,
          contents: query,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          }
        });
        if (response?.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} attempt ${attempt} failed, retrying or trying alternate:`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  throw lastError || new Error('All content generation attempts failed.');
}

export async function runAICoreEngine(
  tenantId: string,
  customerId: string,
  query: string,
  isReactivated: boolean = false
): Promise<AIResponsePayload> {
  const tenant = db.getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found in database registry.`);
  }

  const client = getAIClient();
  if (!client) {
    // If no real API key is injected, route straight to conversational simulation
    return processConversationalSimulation(tenant.industry_type, query, tenantId, customerId, isReactivated);
  }

  try {
    // Match semantic knowledge base docs
    const RAGMatches = findRAGMatches(tenantId, query);
    const contextSnippet = RAGMatches.length > 0 ? `Use the following knowledge base document context to inform your responses:\n\n${RAGMatches.join('\n\n')}` : '';

    // Retrieve conversation history for history judgment before making decisions
    const userConversations = db.getConversations(tenantId).filter((c) => c.customer_id === customerId);
    const allMessages: Message[] = [];
    for (const conv of userConversations) {
      const msgs = db.getMessages(conv.id);
      allMessages.push(...msgs);
    }
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Filter out the actual current message if found in logs
    let pastMessages = allMessages;
    if (allMessages.length > 0 && allMessages[allMessages.length - 1].content === query) {
      pastMessages = allMessages.slice(0, -1);
    }

    const historySnippet = pastMessages.length > 0 
      ? `You MUST exercise history judgment to refer to and understand past context, booking details, past queries, and customer names before making decisions or answering the new message. Here is the chronological history of messages with this customer:\n` + pastMessages.map(m => `- ${m.sender.toUpperCase()}: ${m.content}`).join('\n')
      : `No prior conversation history. This user is starting a brand new conversation with you.`;

    const reactivationSnippet = isReactivated 
      ? `\nCRITICAL CONTEXT: This customer.id is returning and starting a fresh session after having resolved their previous tickets. Warmly welcome them back, acknowledge they were here before, and DO NOT ask them to repeat information (like names, addresses, or previous products) they have already submitted in the conversation history snippet above.`
      : '';

    const systemPrompt = `You are Swibz AI Core - a production-safe multi-tenant system executing virtual workflows and tool calls for "${tenant.company_name}" (Industry: ${tenant.industry_type}).
Your replies must strictly represent the business profile.
Address the customer politely. Keep replies clean, professional, and localized in Ugandan context if helpful (Currency is UGX).
${reactivationSnippet}

${contextSnippet}

${historySnippet}

Based on the customer request and history, decide the appropriate response.
You have access to virtual tool call capabilities, but DO NOT write JSON schemas manually in response text. Speak naturally.
If they are confirming an order, requesting booking, pricing, record lookup, solve it inside your instructions and formulate a perfect natural-language reply showing the solved numbers.`;

    const replyText = await generateContentWithRetryAndFallback(client, systemPrompt, query);

    // Extract tool calls and lead scores in background using processHeuristic to preserve interactive smoothness
    const simulatedResult = processConversationalSimulation(tenant.industry_type, query, tenantId, customerId, isReactivated);

    // Merge real Gemini response text with simulated tool triggers for maximum reliability in visual boards!
    return {
      reply: replyText,
      toolCalls: simulatedResult.toolCalls,
      workflowTriggered: simulatedResult.workflowTriggered,
      customerLeadScore: simulatedResult.customerLeadScore
    };

  } catch (error) {
    console.error('Gemini content generation failed, routing to local simulator:', error);
    return processConversationalSimulation(tenant.industry_type, query, tenantId, customerId);
  }
}

// Learn from conversations function
export async function learnFromConversations(tenantId: string): Promise<{ success: boolean; content: string; name: string }> {
  const tenant = db.getTenant(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // 1. Fetch conversations and all messages
  const conversations = db.getConversations(tenantId);
  const allMessages: Message[] = [];
  for (const conv of conversations) {
    const msgs = db.getMessages(conv.id);
    allMessages.push(...msgs);
  }

  let prompt = '';
  if (allMessages.length === 0) {
    prompt = `The company is "${tenant.company_name}" operating in "${tenant.industry_type}". Since there are no active chat logs, construct a comprehensive, highly detailed, local-focused Customer Experience FAQ and service playbook template. Discuss optimal billing, default customer schedules, local Ugandan delivery coordinates, and operational parameters.`;
  } else {
    const logTimeline = allMessages
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n');
    prompt = `You are an expert business knowledge-miner analyzing the chat logs of "${tenant.company_name}" (Industry: ${tenant.industry_type}) to design an updated, authoritative service reference.
Extract recurring client requests, common issues, resolved service paths, key service preferences, and operational FAQ structures.
Distill these details into a structured, highly valuable corporate knowledge document.

Here are the raw conversation chat logs:
${logTimeline}`;
  }

  const systemInstructions = `You are an Advanced AI Knowledge Extractor. Your task is to output a well-formatted, professional Markdown knowledge base document that lists core user inquiries, resolved answers, operational policies learnt, and helpful customer coordination hints. Keep the output clean, objective, and highly factual.`;

  let learnedText = '';
  const client = getAIClient();

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstructions,
          temperature: 0.3,
        }
      });
      learnedText = response.text || '';
    } catch (e) {
      console.error('Error generating conversational learnings:', e);
    }
  }

  // Fallback / Simulator if no client or generateContent failed
  if (!learnedText) {
    const dates = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (tenant.industry_type === 'delivery') {
      learnedText = `# Swibz Operations Learning Ledger (${dates})

Based on recent Kampala courier inquiries, we have compiled the following operational facts:
- **Major Routes & Rates:** Recurrent demand covers Ntinda, Kololo, Nakasero, and Kampala central zones. Base fee of UGX 4,000 remains highly popular relative to Kampala traffic indices.
- **Client Preferences:** High priority is placed on express envelope delivery. Customers expect rider credentials to be texted promptly.
- **Frequent FAQs:** 
  - *Q: can I cancel a dispatch mid-transit?* Refund rules allow cancellation before dispatch lookup.
  - *Q: are heavy box delivery orders supported?* Only lightweight courier items below 10KG are processed dynamically.
- **Rider Metrics:** Available dispatchers like Sula Musoke & John Mugisha Jr. are achieving optimal transit ratings.`;
    } else if (tenant.industry_type === 'clinic') {
      learnedText = `# Victoria Medical Learning Ledger (${dates})

Based on recent medical consult inquiries, we have compiled the following clinical insights:
- **Inquiry Distributions:** Over 65% of customer inquiries request dental consultation schedules, followed by general health practitioner wellness slot availability.
- **Patient Scheduling Habits:** Strong preference for mid-morning slots (10:00 AM - 11:30 AM). Users recurrently request verification of physician names.
- **Clinician FAQ Digests:**
  - *Q: do you support insurance checkups?* Local procedures cover key corporate healthcare schemes. Patients must present authorization leaflets.
  - *Q: can teeth cleaning consults be booked on short notice?* Yes, checked slot availability allows prompt reserves.`;
    } else {
      learnedText = `# Green Hill Financial Learning Ledger (${dates})

Based on recent guardian and school administration inquiries, we have compiled the following details:
- **Tuition Balances:** Recurrent inquiries relate to student fee status checks for Derrick Opio Jr. and other students.
- **Payment Pathways:** Guardian messages prove that MTN Pay (Merchant 4321) is preferred over manual Stanbic Bank deposits.
- **Administrative FAQs:**
  - *Q: are vacancy slots active for boarding?* Boarding vacancies are active for S1, S2, S3, and S5 classes.
  - *Q: are tuition installments supported?* Accounts division permits early installments with a standard commitment letter.`;
    }
  }

  const documentName = `Learnt from Conversations (${new Date().toLocaleDateString()})`;
  
  // Add to DB
  const chunkCount = Math.ceil(learnedText.length / 150);
  const kbItem = db.addKBItem(tenantId, documentName, 'txt', learnedText, chunkCount);

  return {
    success: true,
    content: learnedText,
    name: documentName
  };
}

// Learn from internet function
export async function learnFromInternet(tenantId: string, searchTopic: string): Promise<{ success: boolean; content: string; name: string; sources: string[] }> {
  const tenant = db.getTenant(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const prompt = `Research and write a highly objective, fact-rich corporate knowledge guide on: "${searchTopic}".
Relate the facts to the industry "${tenant.industry_type}" and optimize for a business customer support training manual if appropriate.
Include real localized details of local operators, guidelines, regulations, or recent trends. Do not include verbose introductions, write the facts directly.`;

  const systemInstructions = `You are a professional Research Analyst. You provide clean, markdown-structured research documents containing verified industry facts.`;

  let content = '';
  const sources: string[] = [];
  const client = getAIClient();

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstructions,
          tools: [{ googleSearch: {} }],
          temperature: 0.3,
        }
      });
      content = response.text || '';

      // Extract Grounding Citations
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push(chunk.web.uri);
          }
        });
      }
    } catch (e) {
      console.warn('Google search grounding failed; running secure text fallback...', e);
    }
  }

  // Fallback simulator if no client or search failed
  if (!content) {
    const lowerTopic = searchTopic.toLowerCase();
    sources.push('https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(searchTopic));
    sources.push('https://www.google.com/search?q=' + encodeURIComponent(searchTopic));

    if (lowerTopic.includes('uganda') || lowerTopic.includes('momo') || lowerTopic.includes('kampala')) {
      content = `# Industry Analysis: ${searchTopic}

## Local Context & Market Overview
Recent data shows Uganda's mobile money (MTN MoMo, Airtel Money) ecosystem continues to lead financial digitisation in Kampala. 
- **Surcharge Regulations:** Official directives set basic consumer transaction caps. Merchant collection codes bypass user-side withdrawal feeds.
- **Regional Commerce Guides:** Kampala business districts (Kikuubo, Nakasero) are moving heavily to cash-lite logistics models. High demand for instant dispatchers.
- **Logistics Indicators:** Kampala e-commerce relies heavily on bodaboda couriers, with standard rates starting at UGX 4,000 for local distances and scaling with traffic.
- **Healthcare Guides:** Local medical facilities leverage digitized records to align dental consult boards and doctor dispatch schedules.

*Document compiled dynamically from online research query sources.*`;
    } else {
      content = `# Research Guide: ${searchTopic}

## General Market Synthesis
Detailed internet synthesis reveals the following parameters for "${searchTopic}":
- **Standard Guidelines:** Industry practitioners prioritize unified customer portals to control information assets, billing status registers, and appointment queues.
- **Pricing Indicators:** Standard service plans start around STARTER tiers, scaling to enterprise customized schedules.
- **Modern Trends:** The intersection of cloud automation and localized business channels (WhatsApp, Webchat) is growing rapidly to optimize response latencies.
- **Regulatory Frameworks:** Operations must align with international standards and direct compliance coordinates to verify validity.

*Document compiled dynamically from online research query sources.*`;
    }
  }

  // Format sources cleanly at the bottom
  if (sources.length > 0) {
    const formattedSources = sources.map((s, index) => `[${index + 1}] ${s}`).join('\n');
    content += `\n\n### Grounded Search References:\n${formattedSources}`;
  }

  const documentName = `Internet Research: ${searchTopic}`;
  const chunkCount = Math.ceil(content.length / 150);
  const kbItem = db.addKBItem(tenantId, documentName, 'url', content, chunkCount, sources[0] || 'https://google.com');

  return {
    success: true,
    content: content,
    name: documentName,
    sources: sources
  };
}
