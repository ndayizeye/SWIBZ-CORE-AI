/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkflowNode, WorkflowEdge } from '../types.js';

export interface IndustryFAQ {
  question: string;
  answer: string;
}

export interface IndustryWorkflow {
  name: string;
  trigger_event: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface IndustrySuggestedResponse {
  scenario: string;
  template: string;
}

export interface LeadCaptureField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'select';
  required: boolean;
  options?: string[];
}

export interface IndustrySpecificAction {
  name: string;
  label: string;
  description: string;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  terminology: string[];
  faqs: IndustryFAQ[];
  workflows: IndustryWorkflow[];
  services: string[];
  suggested_responses: IndustrySuggestedResponse[];
  actions: IndustrySpecificAction[];
  lead_capture_fields: LeadCaptureField[];
  ai_instructions: string;
}

export const defaultIndustryTemplates: IndustryTemplate[] = [
  {
    id: 'delivery',
    name: 'Logistics & Delivery',
    description: 'Auto route distance mapping, driver courier assignments & fare quote generators',
    terminology: ['consignment', 'waybill', 'dispatch', 'last-mile', 'FOB', 'transit', 'reverse-logistics'],
    services: ['Standard Instant Courier', 'Heavy Cargo Haulage', 'Multi-Stop Delivery Route', 'Next Day Safe Parcel'],
    faqs: [
      { question: 'What is the package weight limit for motorcycle couriers?', answer: 'Our standard motorcycle couriers accept up to 15 kilograms. For heavier loads, please book a flatbed carrier.' },
      { question: 'How is the delivery fare calculated?', answer: 'We charge a base dispatch fee of UGX 4,000, plus UGX 1,500 per kilometer calculated automatically via Google Maps.' },
      { question: 'Do you offer cash on delivery (COD)?', answer: 'Yes, we secure cod handovers with 1.8% processing commission.' }
    ],
    workflows: [
      {
        name: 'Automated Courier Dispatch',
        trigger_event: 'customer_requests_delivery',
        description: 'Puts delivery details, estimates cost, and requests closest available courier rider.',
        nodes: [
          { id: 'w1', type: 'trigger', label: 'Inbound Delivery Request', description: 'Triggered when customer wants to send a parcel.' },
          { id: 'w2', type: 'action', label: 'Estimate Maps Coordinates', description: 'Calculates shortest route kilometers.' },
          { id: 'w3', type: 'action', label: 'Broadcast Dispatch to Riders', description: 'Sends push notification to available couriers.' }
        ],
        edges: [
          { from: 'w1', to: 'w2' },
          { from: 'w2', to: 'w3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'New booking greeting', template: 'Sure! Let\'s get that delivery booked. Could you please share the pickup address and dropoff address?' },
      { scenario: 'Price query', template: 'To quote your fare, could you let me know the pickup and dropoff spots within Kampala?' }
    ],
    actions: [
      { name: 'calculate_delivery_price', label: 'Calculate Routing & Price', description: 'Estimates transit distances in UGX.' },
      { name: 'create_delivery_order', label: 'Reserve Rider Dispatch', description: 'Commits courier and assigns tracking ID.' }
    ],
    lead_capture_fields: [
      { name: 'pickup_address', label: 'Pickup Location', type: 'text', required: true },
      { name: 'dropoff_address', label: 'Drop-off Destination', type: 'text', required: true },
      { name: 'package_desc', label: 'Parcel Details & Weight', type: 'text', required: true },
      { name: 'contact_phone', label: 'Recipient Phone', type: 'phone', required: true }
    ],
    ai_instructions: 'You are an elite logistics marshal. Prioritize quoting precise delivery fees (base UGX 4000 + 1500/km) and securing recipient phone lines.'
  },
  {
    id: 'school',
    name: 'Schools & Academies',
    description: 'Tuition inquiry processing, circular dispatch & parent CRM lead captures',
    terminology: ['prospectus', 'curriculum', 'humanities', 'bursary', 'visitation', 'boarder', 'scholars'],
    services: ['Boarding Section Enrolment', 'Day Scholar Registration', 'Kindergarten Playgroup', 'Bursary Advisory'],
    faqs: [
      { question: 'What are the tuition fees per term?', answer: 'Boarding Section fees are UGX 1,800,000 per term inclusive of meals and room. Day scholar fees are UGX 1,100,000.' },
      { question: 'Are admission openings available now?', answer: 'Admissions are open for Senior One through Senior Three, and Senior Five. Parents are welcome to visit our admin desk.' },
      { question: 'Can parents pay tuition on installments?', answer: 'Yes, a minimum of 60% is required at check-in, with the balance paid before midterm exams.' }
    ],
    workflows: [
      {
        name: 'Parent Lead Prospecting',
        trigger_event: 'parent_inquiry',
        description: 'Auto-checks term calendar and captures student details to score lead interest.',
        nodes: [
          { id: 'sc1', type: 'trigger', label: 'Parent Inbound Question', description: 'Triggers when parents ask about admissions.' },
          { id: 'sc2', type: 'action', label: 'Assess Class Openings', description: 'Queries class desks for student seat vacancies.' },
          { id: 'sc3', type: 'action', label: 'Create Admitted Lead File', description: 'Creates CRM logs for Registrar follow-up.' }
        ],
        edges: [
          { from: 'sc1', to: 'sc2' },
          { from: 'sc2', to: 'sc3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Admissions query', template: 'We are delighted you are considering our school! May I know the student\'s name and the entry class you are applying for?' },
      { scenario: 'Visitation day', template: 'Visitation occurs on the 1st Sunday of every month from 10:00 AM to 5:00 PM.' }
    ],
    actions: [
      { name: 'query_admissions', label: 'Verify Class Openings', description: 'Checks if admissions for a particular class seat are open.' },
      { name: 'register_student_lead', label: 'Catalog Parent Lead', description: 'Saves parent contact data into the registrar bureau.' }
    ],
    lead_capture_fields: [
      { name: 'student_name', label: 'Student\'s Full Name', type: 'text', required: true },
      { name: 'target_class', label: 'Class of Entry (S1-S6)', type: 'select', required: true, options: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
      { name: 'parent_email', label: 'Parent Email Address', type: 'email', required: true },
      { name: 'boarding_interest', label: 'Boarding or Day Scholar?', type: 'select', required: true, options: ['Boarding Section', 'Day Scholar'] }
    ],
    ai_instructions: 'You are an educational registrar. Speak with warmth, focus on boarding check-in policies, and log applicant lead scores.'
  },
  {
    id: 'clinic',
    name: 'Medical Clinics & Hospitals',
    description: 'Physician slot checks, laboratory test bookings & patient CRM intake',
    terminology: ['pediatric', 'diagnosis', 'triage', 'prescription', 'consultation', 'OPD', 'immunization'],
    services: ['General GP Consultation', 'Pediatric Checkup', 'Dental Care Service', 'Laboratory Blood Work'],
    faqs: [
      { question: 'What is the general consultation fee?', answer: 'The general practitioner consultation is UGX 50,000 for standard OPD walk-ins.' },
      { question: 'Is the Dental Clinic open on weekends?', answer: 'Dr. Brenda Namaganda is available Mon-Fri 8 AM to 5 PM. Weekend dental coverage is available by on-call practitioners only.' },
      { question: 'How much are basic diagnostic lab tests?', answer: 'Full blood counts are UGX 25,000, Malaria rapid tests are UGX 10,000, and Ultrasounds are UGX 45,000.' }
    ],
    workflows: [
      {
        name: 'Patient Triage Queue',
        trigger_event: 'appointment_request',
        description: 'Secures primary symptoms, cross-checks duty rota, and places clinic queue slots.',
        nodes: [
          { id: 'cl1', type: 'trigger', label: 'Appointment Requested', description: 'Triggered when patient requests checkup.' },
          { id: 'cl2', type: 'action', label: 'Verify Doctor Duty Schedule', description: 'Checks if doctor is in-clinic.' },
          { id: 'cl3', type: 'action', label: 'Reserve Consultation Ticket', description: 'Queues patient token.' }
        ],
        edges: [
          { from: 'cl1', to: 'cl2' },
          { from: 'cl2', to: 'cl3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Book consultation greeting', template: 'Hello. I can help book you for doctor consultations. Which department (e.g. Dental, Pediatrics, General Medicine) are you seeking?' },
      { scenario: 'Emergency fallback', template: 'If you are experiencing severe symptoms, please visit our 24/7 emergency unit directly.' }
    ],
    actions: [
      { name: 'verify_physician_slot', label: 'Check Doctor Schedule Roster', description: 'Checks slot availability for medical practitioners.' },
      { name: 'queue_appointment', label: 'Commit Clinic Appointment', description: 'Saves consultation metadata to the triage systems.' }
    ],
    lead_capture_fields: [
      { name: 'patient_name', label: 'Patient Name', type: 'text', required: true },
      { name: 'department', label: 'Medical Department', type: 'select', required: true, options: ['General Medicine', 'Dental Department', 'Pediatrics Office', 'Physiotherapy'] },
      { name: 'symptoms', label: 'Brief Symptoms Description', type: 'text', required: true },
      { name: 'appointment_date', label: 'Preferred Date', type: 'text', required: true }
    ],
    ai_instructions: 'You are an empathetic, clinical receptionist. Never provide diagnostic claims, prioritize OPD ticketing, and safeguard private records.'
  },
  {
    id: 'hotel',
    name: 'Hotels & Lodges',
    description: 'Room reservations, room service logs & hospitality check-in policies',
    terminology: ['tariff', 'concierge', 'check-out', 'room-service', 'occupancy', 'minibar', 'shuttle'],
    services: ['Standard Single Room', 'Deluxe Twin Room', 'Sovereign Suite Accommodation', 'Entebbe Airport Shuttle'],
    faqs: [
      { question: 'What is the check-out hour deadline?', answer: 'Standard check-out is at 10:00 AM. Late check-outs up to 2:00 PM are subject to 50% extra room charges.' },
      { question: 'What are the room charges including breakfast?', answer: 'Standard Single is UGX 120,000 per night. Deluxe Twin is UGX 220,000. Executive Sovereign Suite is UGX 450,000.' },
      { question: 'Do you provide airport shuttle services?', answer: 'Yes, our Entebbe Airport shuttle runs every 3 hours starting at 4:30 AM (UGX 50,000 per passenger, free for Suite bookings).' }
    ],
    workflows: [
      {
        name: 'Accommodations Booking',
        trigger_event: 'room_reservation',
        description: 'Asks for room class interest, dates of occupancy, and registers checkout parameters.',
        nodes: [
          { id: 'ht1', type: 'trigger', label: 'Room Inquiry Received', description: 'Triggers when guest queries room.' },
          { id: 'ht2', type: 'action', label: 'Search Room Availability', description: 'Cross-checks occupancy calendars.' },
          { id: 'ht3', type: 'action', label: 'Submit Stay Ledger', description: 'Locks down room booking details.' }
        ],
        edges: [
          { from: 'ht1', to: 'ht2' },
          { from: 'ht2', to: 'ht3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Room inquiry greeting', template: 'Welcome to our Guest Support Desk! We offer Standard, Deluxe, and Sovereign Suites. What dates are you looking to stay?' },
      { scenario: 'Airport transfer', template: 'To schedule your Entebbe shuttle, please share your flight arrival time and ticket reference.' }
    ],
    actions: [
      { name: 'check_room_occupancy', label: 'Query Room Calendar', description: 'Checks rooms availability.' },
      { name: 'reserve_suite_accomodation', label: 'Lock Accomodation Session', description: 'Reserves reservation ledger keys.' }
    ],
    lead_capture_fields: [
      { name: 'guest_name', label: 'Lead Traveler Name', type: 'text', required: true },
      { name: 'room_class', label: 'Preferred Room Category', type: 'select', required: true, options: ['Standard Single', 'Deluxe Twin', 'Executive Suite'] },
      { name: 'nights_count', label: 'Number of Nights Stay', type: 'number', required: true },
      { name: 'target_date', label: 'Check-in Calendar Date', type: 'text', required: true }
    ],
    ai_instructions: 'You are a charming concierge expert. Guide guests about room tariffs, point out free spa services, and emphasize our Entebbe airport shuttle.'
  },
  {
    id: 'real_estate',
    name: 'Real Estate Agencies',
    description: 'Property site viewing registrations, house rental catalogs & land buyer logs',
    terminology: ['tenancy', 'titled-plot', 'duplex', 'escrow', 'easement', 'conveyancing', 'demised'],
    services: ['Commercial Office Rentals', 'Residential Duplex Listing', 'Titled Land Brokerage', 'Corporate Property Walkthroughs'],
    faqs: [
      { question: 'What is the rental model for commercial office spaces?', answer: 'Our standard Ntinda spaces start from UGX 1,200,000 monthly, with a standard deposit return policy of 2 months upfront.' },
      { question: 'Do land plots have clean land registry titles?', answer: 'Yes, all Gayaza and Mukono residential plots hold fully verified, clean survey titles with clear boundaries.' },
      { question: 'How can I schedule a site visitation visit?', answer: 'We hold open site visits every Saturday morning starting at 9:00 AM from our offices. Bookings are open.' }
    ],
    workflows: [
      {
        name: 'Site Visit Planner',
        trigger_event: 'property_tour_request',
        description: 'Auto compiles buyer criteria, checks plots listings, and locks visits dates.',
        nodes: [
          { id: 're1', type: 'trigger', label: 'Site View Request', description: 'Buyer wants an on-ground tour.' },
          { id: 're2', type: 'action', label: 'Filter Open Plots', description: 'Matches plot size requirements.' },
          { id: 're3', type: 'action', label: 'Log CRM Tour Lead', description: 'Registers visitor in Saturday rota.' }
        ],
        edges: [
          { from: 're1', to: 're2' },
          { from: 're2', to: 're3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Rent inquiry', template: 'Certainly. I can assist you with our available spaces. Are you looking to buy land titled plots or lease residential apartments?' },
      { scenario: 'Tour booking confirmation', template: 'Great, I will register you for our Saturday site tour. May I capture your phone line?' }
    ],
    actions: [
      { name: 'search_deeds_registry', label: 'Lookup Active Properties', description: 'Searches matching active apartments listings.' },
      { name: 'register_tourist_visitor', label: 'Register Visit Roster', description: 'Locks visitor parameters on CRM lists.' }
    ],
    lead_capture_fields: [
      { name: 'buyer_name', label: 'Buyer Full Name', type: 'text', required: true },
      { name: 'property_bracket', label: 'Investment Category', type: 'select', required: true, options: ['Titled Land Plot', 'Residential Rental', 'Corporate Office Space'] },
      { name: 'budget_level', label: 'Target Budget Bracket (UGX)', type: 'number', required: true },
      { name: 'tour_saturday', label: 'Book for Saturday Tour?', type: 'select', required: true, options: ['Yes', 'No'] }
    ],
    ai_instructions: 'You are an agent of properties transactions. Direct conversations toward booking Saturday visits and verify budget brackets.'
  },
  {
    id: 'sacco',
    name: 'Microfinance & SACCOs',
    description: 'Savings accounts ledger, loans eligibility checks & memberships forms',
    terminology: ['share-capital', 'dividends', 'guarantor', 'interest-flat', 'credit-worthiness', 'collateral', 'voluntary-savings'],
    services: ['Voluntary Compound Savings', 'Emergency Micro Loan', 'Development Capital Loan', 'Share Capital Growth'],
    faqs: [
      { question: 'What is the share capital entry rate?', answer: 'A minimum of 20 shares at UGX 20,000 per share (UGX 400,000) is required to unlock borrowing power.' },
      { question: 'What are the interest rates on community emergency loans?', answer: 'Emergency loans undergo a flat interest rate of 1.5% monthly, repayable within 6 months.' },
      { question: 'How long does micro loan disbursement take?', answer: 'Once verified by 2 active members as guarantors, payouts land within 48 business hours.' }
    ],
    workflows: [
      {
        name: 'Credit Eligibility Triage',
        trigger_event: 'loan_eligibility_req',
        description: 'Collects active shares amount, guarantor details, and files credit scores files.',
        nodes: [
          { id: 'sc1', type: 'trigger', label: 'Credit Limit Inquiry', description: 'Triggers when client wants to borrow.' },
          { id: 'sc2', type: 'action', label: 'Review Share Balance', description: 'Multiplies savings deposits by credit index.' },
          { id: 'sc3', type: 'action', label: 'Score Micro Credit Lead', description: 'Prepares loan application ledger.' }
        ],
        edges: [
          { from: 'sc1', to: 'sc2' },
          { from: 'sc2', to: 'sc3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'SACCO join greeting', template: 'Hello! I can help you join our SACCO, calculate savings compound dividends, or pre-qualify emergency loans. Are you an active registered member?' },
      { scenario: 'Loan prequalifier', template: 'To see your maximum loan limit (which is 3 times your total voluntary savings), what is your active savings balance?' }
    ],
    actions: [
      { name: 'calculate_interest_dividends', label: 'Estimate Savings Interest', description: 'Multiplies voluntary shares values.' },
      { name: 'assess_credit_index', label: 'Verify Borrowing Power', description: 'Compares active guarantors limits.' }
    ],
    lead_capture_fields: [
      { name: 'member_name', label: 'Member Name', type: 'text', required: true },
      { name: 'shares_balance', label: 'Active SACCO Voluntary Savings (UGX)', type: 'number', required: true },
      { name: 'co_guarantors', label: 'Number of Active Guarantors (Min 2)', type: 'number', required: true },
      { name: 'wanted_loan', label: 'Wanted Loan Amount', type: 'number', required: true }
    ],
    ai_instructions: 'You are an auditing microfinance expert. Maintain strict security tone, emphasize guarantor guidelines (min 2), and compute savings indexes.'
  },
  {
    id: 'retail',
    name: 'Retail Businesses',
    description: 'Inventory item catalog checks, market branches directions & invoices delivery',
    terminology: ['purchase-ledger', 'barcoding', 'bulk-rebate', 'VAT-invoice', 'consignment-stock', 'Nakasero-market'],
    services: ['Wholesale Office Supply', 'Nakasero Market Outlet Retail', 'Custom Business Merchandise', 'Unified Billing Delivery'],
    faqs: [
      { question: 'Where is your wholesale market branch?', answer: 'Our central outlet is located along Nakasero Market Lane, Kampala. We are open Monday to Saturday from 8:00 AM to 7:00 PM.' },
      { question: 'Do you offer bulk delivery discounts?', answer: 'Yes! Bulk purchases of items totaling over UGX 500,000 receive an instant 10% cash discount plus free Kampala shipping.' },
      { question: 'What is your product change circular policy?', answer: 'Defective products can be exchanged within 3 days upon presenting the physical barcode cash receipt.' }
    ],
    workflows: [
      {
        name: 'Bulk Sales Dispatch',
        trigger_event: 'wholesale_inquiry',
        description: 'Auto reserves items, calculates wholesale scale thresholds, and drafts orders bills.',
        nodes: [
          { id: 'rt1', type: 'trigger', label: 'Sales Inbound Quote', description: 'Buyer wants stock availability check.' },
          { id: 'rt2', type: 'action', label: 'Check Stock Ledger', description: 'Cross-checks storage warehouse balances.' },
          { id: 'rt3', type: 'action', label: 'Generate Wholesale Invoice', description: 'Calculates bulk discounts list.' }
        ],
        edges: [
          { from: 'rt1', to: 'rt2' },
          { from: 'rt2', to: 'rt3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Merchandise quote request', template: 'Greetings. I can supply items for your team. What list of wholesale assets can we fetch for you today?' },
      { scenario: 'Receipt issues', template: 'Sure! Please send a photo of your physical barcode cash receipt, and I will align the support department.' }
    ],
    actions: [
      { name: 'check_item_stock', label: 'Query Raw Stock Levels', description: 'Checks item counts in warehouses.' },
      { name: 'draft_wholesale_bill', label: 'Build Itemized Invoice', description: 'Calculates prices including VAT.' }
    ],
    lead_capture_fields: [
      { name: 'store_owner', label: 'Inquirer Full Name', type: 'text', required: true },
      { name: 'company_title', label: 'Enterprise/Store Name', type: 'text', required: true },
      { name: 'stock_list', label: 'Required Stock Items & Quantities', type: 'text', required: true },
      { name: 'payment_method', label: 'Preferred Billing Choice', type: 'select', required: true, options: ['MTN Mobile Money', 'Airtel Money', 'Bank Wire', 'Cash on Delivery'] }
    ],
    ai_instructions: 'You are a pragmatic retail merchant. Emphasize bulk discounts (over UGX 500k is 10% off), quote Nakasero market open hours, and direct guests to log stock lists.'
  },
  {
    id: 'restaurant',
    name: 'Restaurants & Cafes',
    description: 'F&B menus listings, table reservations checkout & logistics integration',
    terminology: ['luwombo', 'reservation', 'carte', 'mignardise', 'matooke', 'bistro', 'takeaway'],
    services: ['Fast Food Burger Pizza', 'Traditional Ugandan Delicacies', 'Coffee & Cold Beverages', 'Takeaway Courier Payouts'],
    faqs: [
      { question: 'What are the diner kitchen hours?', answer: 'Our kitchen processes F&B orders daily from 10:00 AM up to 11:30 PM.' },
      { question: 'What traditional dishes are on the menu today?', answer: 'We specialize in organic Chicken Luwombo served with traditional matooke steamed rice and local groundnut sauce (UGX 15,000).' },
      { question: 'How much are table reservations?', answer: 'Table bookings are 100% free of charge! We hold reserved dining tables for a maximum of 20 minutes before releasing them.' }
    ],
    workflows: [
      {
        name: 'Dinner Table Booker',
        trigger_event: 'table_reservation_req',
        description: 'Auto checks table spots, captures guest count, and sets calendar spots.',
        nodes: [
          { id: 'rs1', type: 'trigger', label: 'Table Booking Request', description: 'Guest requests to book a dining table.' },
          { id: 'rs2', type: 'action', label: 'Verify Table Vacancy', description: 'Checks seating rota for reserved spots.' },
          { id: 'rs3', type: 'action', label: 'Confirm Free Dining Ticket', description: 'Registers checkout details and limits booking.' }
        ],
        edges: [
          { from: 'rs1', to: 'rs2' },
          { from: 'rs2', to: 'rs3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Food list request', template: 'Our kitchen is fully fired up! We offer delicious beef burgers, Pepperoni pizza, and organic Chicken Luwombo. What can I prepare for you?' },
      { scenario: 'Table seating detail', template: 'Great, what time are you looking to dine and how many guests will I set the table for today?' }
    ],
    actions: [
      { name: 'verify_table_seating', label: 'Search Seating Logs', description: 'Verifies if an open lounge table is free.' },
      { name: 'commit_menu_payout', label: 'Register Table Seating', description: 'Secures dining booking variables.' }
    ],
    lead_capture_fields: [
      { name: 'diner_name', label: 'Guest Name', type: 'text', required: true },
      { name: 'guests_count', label: 'Diners Counts', type: 'number', required: true },
      { name: 'dinner_time', label: 'Enter Seating Schedule Time', type: 'text', required: true },
      { name: 'meal_choices', label: 'Pre-ordered Fast Foods / Traditional luwombo', type: 'text', required: true }
    ],
    ai_instructions: 'You are a helpful and polite waiter. Evoke the delicious aromas of Kampala Luwombo and beef burgers, stress free table rules, and secure takeaway details.'
  },
  {
    id: 'hardware',
    name: 'Hardware Shops',
    description: 'Materials wholesale catalog checks, construction bulk pricing & logistics dispatcher',
    terminology: ['portland', 'sheet-corrogated', 'roll-copper', 'grade-strength', 'emulsion', 'flatbed-truck'],
    services: ['Bulk Cement Construction', 'Preprinted Roof Sheets', 'Copper Wiring Rolls', 'Flatbed Logistics Transportation'],
    faqs: [
      { question: 'What is the price of Portland cement?', answer: 'We supply Grade 32.5R Portland cement for UGX 38,000 per bag. High-strength Grade 42.5R is UGX 42,000 per bag.' },
      { question: 'Do you retail maroon roofs G30?', answer: 'Yes! Preprinted maroon corrugated iron sheets (30 Gauge) are UGX 48,000 per standard sheet.' },
      { question: 'How can heavy material logistics be organized?', answer: 'We dispatch bulky loads directly to construction sites using our corporate Isuzu flatbed trucks at negotiable distance rates.' }
    ],
    workflows: [
      {
        name: 'Bulk Materials Quote Builder',
        trigger_event: 'materials_quote_request',
        description: 'Compiles cement and sheet requirements and schedules Isuzu shipping.',
        nodes: [
          { id: 'hw1', type: 'trigger', label: 'Quote Request Inbound', description: 'Builder seeks bulk construction pricing.' },
          { id: 'hw2', type: 'action', label: 'Calculate Bulk Discounts', description: 'Applies discounted margins per bag.' },
          { id: 'hw3', type: 'action', label: 'Schedule flatbed truck', description: 'Books Isuzu dispatcher for heavy items.' }
        ],
        edges: [
          { from: 'hw1', to: 'hw2' },
          { from: 'hw2', to: 'hw3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Cement quote', template: 'Greetings. I can supply Grade 32.5R and 42.5R high-strength cement. How many bags does your building site need?' },
      { scenario: 'Material dispatch request', template: 'Understood. Where is the building plot located so I can estimate flatbed transport charges?' }
    ],
    actions: [
      { name: 'resolve_inventory_level', label: 'Verify Construction Stocks', description: 'Check metal sheet sheets and cement balance in yard.' },
      { name: 'estimate_trucking_logistics', label: 'Secure Flatbed Shipping', description: 'Calculates truck driver fees.' }
    ],
    lead_capture_fields: [
      { name: 'contractor_name', label: 'Builder/Contractor Name', type: 'text', required: true },
      { name: 'cement_bags_needed', label: 'Bags of Cement (Grade 32.5/42.5)', type: 'number', required: true },
      { name: 'sheets_g30_needed', label: 'Iron Sheets G30 counts', type: 'number', required: true },
      { name: 'destination_site', label: 'Site Location / Construction Address', type: 'text', required: true }
    ],
    ai_instructions: 'You are an industrious hardware merchant. Focus on material grade strength, list Isuzu trucking logistics, and quote cement bag fees.'
  },
  {
    id: 'security',
    name: 'Security & Guarding Services',
    description: 'Corporate guard patrol squads, perimeter alarm setups & rapid supervisor monitoring',
    terminology: ['sentries', 'perimeter-alarm', 'bodyguards-vip', 'response-squad', 'Supervisor-audits', 'sirens'],
    services: ['Corporate Guard Patrol', 'Residential Sentry Shift', 'VIP Bodyguard Protection', 'Razor Electric Fencing'],
    faqs: [
      { question: 'What is the rate for static corporate guarding?', answer: 'Our highly trained corporate sentinel security guards start at UGX 350,000 per officer month-to-month.' },
      { question: 'How do residential sentries operate?', answer: 'We dispatch daytime/nighttime split shifts backed by hourly radio checks and unannounced supervisor patrol audits for UGX 280,000 monthly.' },
      { question: 'How fast is your panic alarm squad?', answer: 'Our linked municipal rapid patrol response vehicles dispatch in under 8 minutes across central Kampala.' }
    ],
    workflows: [
      {
        name: 'Rapid Sentry Dispatch',
        trigger_event: 'emergency_sentry_request',
        description: 'Auto tethers panic sirens alerts, files alarm coordinates, and initiates patrol supervisor vehicle.',
        nodes: [
          { id: 'se1', type: 'trigger', label: 'Panic Siren Raised', description: 'An alarm buttons trigger is signaled.' },
          { id: 'se2', type: 'action', label: 'Tether Local Coordinates', description: 'Traces cell tower towers locations.' },
          { id: 'se3', type: 'action', label: 'Dispatch Supervisor Car', description: 'Instructs closest emergency vehicle.' }
        ],
        edges: [
          { from: 'se1', to: 'se2' },
          { from: 'se2', to: 'se3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Security setup inquiry', template: 'Stay secure! We install high-tension razor wires, guard patrols, and rapid response systems. Are you looking to safeguard a business or house?' },
      { scenario: 'Quick crisis report', template: 'ALERT: Our response squad is instantly dispatchable. What is your active municipal district?' }
    ],
    actions: [
      { name: 'locate_patrol_car', label: 'Tricks GPS Supervisor Vehicle', description: 'Locates closest warden warden.' },
      { name: 'initiate_incident_payout', label: 'Register Security Incident', description: 'Flashes dispatch sirens alarms.' }
    ],
    lead_capture_fields: [
      { name: 'client_estate', label: 'Inquirer Name', type: 'text', required: true },
      { name: 'asset_type', label: 'Premises Type', type: 'select', required: true, options: ['Corporate Office HQ', 'Residential House Plot', 'Retail Store / Warehouse'] },
      { name: 'officers_needed', label: 'Sentry Officers Counts', type: 'number', required: true },
      { name: 'fencing_interest', label: 'Install Electric Razor Fence?', type: 'select', required: true, options: ['Yes', 'No'] }
    ],
    ai_instructions: 'You are a formal and strict security marshal dispatcher. Convey unyielding professionalism, outline response alerts (under 8 mins), and catalogue premises specs.'
  },
  {
    id: 'software',
    name: 'SaaS & IT Solutions',
    description: 'Code licenses, cloud servers, uptime guarantees & API routing integrations',
    terminology: ['SLA', 'API-gateway', 'sandbox', 'OAuth', 'scalability', 'microservices', 'uptime'],
    services: ['SaaS App Development', 'Cloud Storage Provision', 'OAuth API Integration', 'Systems Infrastructure Audits'],
    faqs: [
      { question: 'What is your sandbox SLA uptime rating?', answer: 'We guarantee a 99.95% production sandbox/SaaS gateway uptime rating backed by active redundancy clusters.' },
      { question: 'Do you assist with OAuth credentials code?', answer: 'Yes! Our developer helpdesk handles full multi-tenant client-side integrations and secure API endpoints.' },
      { question: 'What are the charges for premium cloud servers?', answer: 'Basic cloud instances start at UGX 150,000 monthly, with scalable auto-throttling capacities.' }
    ],
    workflows: [
      {
        name: 'Technical API Onboarding',
        trigger_event: 'it_sandbox_provision',
        description: 'Auto boots system tokens, checks API structures, and commits server files.',
        nodes: [
          { id: 'it1', type: 'trigger', label: 'Onboarding API Request', description: 'Developer seeks sandbox access keys.' },
          { id: 'it2', type: 'action', label: 'Generate SSL Token', description: 'Creates custom secure access keys.' },
          { id: 'it3', type: 'action', label: 'Deploy Server Shell', description: 'Boots standard docker images parameters.' }
        ],
        edges: [
          { from: 'it1', to: 'it2' },
          { from: 'it2', to: 'it3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Developer API help', template: 'Greetings! I can help you provision sandboxes and integrate our APIs. What framework (e.g. Node.js, Python, Kotlin) is your app using?' },
      { scenario: 'Server upgrade request', template: 'Excellent, I can scale your cloud nodes. How many concurrent sessions does your API require?' }
    ],
    actions: [
      { name: 'verify_api_traffic', label: 'Compute Server Load', description: 'Tracks cloud nodes.' },
      { name: 'deploy_oauth_sandbox', label: 'Provision API Token Keys', description: 'Compiles SSL API gateway logs.' }
    ],
    lead_capture_fields: [
      { name: 'dev_name', label: 'Developer Full Name', type: 'text', required: true },
      { name: 'engine_target', label: 'Software Technology', type: 'text', required: true },
      { name: 'enterprise_api_calls', label: 'Expected API Calls Count/Day', type: 'number', required: true },
      { name: 'sla_level', label: 'Wished Support Tier', type: 'select', required: true, options: ['Developer Free', 'SaaS Regular SLA', 'Enterprise Dedicated Support'] }
    ],
    ai_instructions: 'You are an IT infrastructure engineer. Use concise technical terms, highlight our 99.95% SLA, and record developer endpoint requests.'
  },
  {
    id: 'law_firm',
    name: 'Law Firms & Advocacy',
    description: 'Attorney retainer fees, legal briefing consultations & case file cataloging',
    terminology: ['retainer', 'litigation', 'conveyance', 'demurred', 'deposition', 'affidavit', 'chambers'],
    services: ['Land Conveyancing Services', 'Corporate Business Retainer', 'Litiagation Advocacy', 'Affidavit Certificate Drafting'],
    faqs: [
      { question: 'What is your consultation retainer fee?', answer: 'General consultations start at UGX 150,000 for standard litigation advice in chambers.' },
      { question: 'Do you structure corporate business contracts?', answer: 'Yes, our chambers draft contracts, NDA models, and handles corporate registry filings.' },
      { question: 'What is the conveyancing turnaround rate?', answer: 'Standard land titled deed conveyancing takes 10 to 14 business days.' }
    ],
    workflows: [
      {
        name: 'Case Consultation Scheduler',
        trigger_event: 'counsel_meeting_req',
        description: 'Auto triage dispute fields, catalogs incident documents, and blocks counselor slots.',
        nodes: [
          { id: 'lf1', type: 'trigger', label: 'Counsel requested', description: 'Guest requires professional legal help.' },
          { id: 'lf2', type: 'action', label: 'Category Sift Triage', description: 'Classifies case as land, corporate or civil.' },
          { id: 'lf3', type: 'action', label: 'Block Chamber Hours', description: 'Schedules meeting with advocate desk.' }
        ],
        edges: [
          { from: 'lf1', to: 'lf2' },
          { from: 'lf2', to: 'lf3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Dispute greeting', template: 'Greetings. I can schedule disputes consultations within our chambers. Could you share a high-level summary of your legal matter?' },
      { scenario: 'Retainer discussion', template: 'To initiate contract structuring, our chambers require an active registration fee code.' }
    ],
    actions: [
      { name: 'check_advocate_hours', label: 'List Counselors Availability', description: 'Queries counselor hourly calendars.' },
      { name: 'register_legal_case', label: 'Register Case File ID', description: 'Constructs litigation folders.' }
    ],
    lead_capture_fields: [
      { name: 'client_name', label: 'Client Name', type: 'text', required: true },
      { name: 'dispute_type', label: 'Dispute Theme', type: 'select', required: true, options: ['Titled Land Dispute', 'Corporate Business Retainer', 'Family Will & Estate', 'General Civil Litigation'] },
      { name: 'opposing_party', label: 'Opposing Party Name (Civil check)', type: 'text', required: true },
      { name: 'brief_context', label: 'Brief Narrative of the Dispute', type: 'text', required: true }
    ],
    ai_instructions: 'You are a formal and cautious legal clerk. Avoid writing binding claims, focus on retaining counselor hours, and log civil conflict cases.'
  },
  {
    id: 'automotive',
    name: 'Auto Repair & Garages',
    description: 'Vehicle diagnostic consults, garage mechanic rota & parts pricing',
    terminology: ['spark-plugs', 'manifold', 'alternator', 'diagnostics-obd', 'actuator', 'brakes-pads', 'combustion'],
    services: ['OBD Computer Diagnostics', 'Engine Tuning Overhaul', 'Suspension Bush Repair', 'Brakes System Tuneup'],
    faqs: [
      { question: 'How much are computer OBD diagnostics?', answer: 'We run complete computer diagnostics scans for UGX 45,000 including incident fault reports.' },
      { question: 'Can you source original import auto parts?', answer: 'Yes, we source certified suspension bushings, alternators, and filters with 6 months warranty keys.' },
      { question: 'What is the standard oil change package rate?', answer: 'Oil change starting at UGX 90,000 depending on motor oil grades and lube filters counts.' }
    ],
    workflows: [
      {
        name: 'Auto Repair Booker',
        trigger_event: 'car_checkup_request',
        description: 'Pulls vehicle manufacture brand details, lists issues logs, and assigns auto mechanic.',
        nodes: [
          { id: 'au1', type: 'trigger', label: 'Car Diagnostics Ordered', description: 'Driver requests car checkup.' },
          { id: 'au2', type: 'action', label: 'Lookup Bay Vacancy', description: 'Verifies free garage ramp spaces.' },
          { id: 'au3', type: 'action', label: 'Assign Auto Tech', description: 'Sets mechanic scheduler.' }
        ],
        edges: [
          { from: 'au1', to: 'au2' },
          { from: 'au2', to: 'au3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Car fault greeting', template: 'Hello! I can schedule mechanic checkups in our garage. What is the car manufacture brand and model, and what issue are you facing?' },
      { scenario: 'Quote auto parts', template: 'To search our inventory system for spares, could you share the car engine serial index number?' }
    ],
    actions: [
      { name: 'check_parts_bin', label: 'Verify Parts Stocks', description: 'Queries auto alternator and filter balances.' },
      { name: 'assign_garage_bay', label: 'Book Workstation Bay', description: 'Locks down workspace ramps.' }
    ],
    lead_capture_fields: [
      { name: 'driver_name', label: 'Car Owner Name', type: 'text', required: true },
      { name: 'car_brand', label: 'Vehicle Brand & Model', type: 'text', required: true },
      { name: 'mfg_year', label: 'Manufacturer Year', type: 'number', required: true },
      { name: 'trouble_details', label: 'Vehicle Trouble / Specific Symptoms', type: 'text', required: true }
    ],
    ai_instructions: 'You are an experienced garage foreman. Focus on parts safety, explain computer diagnostics fees (UGX 45k), and capture vehicle models.'
  },
  {
    id: 'beauty_spa',
    name: 'Beauty Salons & Spas',
    description: 'Stylist cosmetic slots, facials therapy & grooming pricing lists',
    terminology: ['balayage', 'exfoliate', 'esthetics', 'manicure', 'hair-toner', 'pedicure', 'dermatology'],
    services: ['Premium Hair Styling Balayage', 'Hydrating Skin Facial', 'Therapeutic Mud Massage', 'Gel Nails Pedicure'],
    faqs: [
      { question: 'Is prior booking required for skin facials?', answer: 'Yes! Our esthetics slots fill up quickly. Please book at least 4 hours in advance to secure treatment.' },
      { question: 'What are the charges for therapeutic massage sessions?', answer: 'Full-body deep pressure mud massage starts at UGX 80,000 per hour.' },
      { question: 'Do you offer bridal makeup packages?', answer: 'Yes, we have custom bridal styling trials starting at UGX 200,000.' }
    ],
    workflows: [
      {
        name: 'Stylist Session Booker',
        trigger_event: 'spa_appointment_req',
        description: 'Sifts hair/massage categories, checks cosmetician calendar, and books parlor seat.',
        nodes: [
          { id: 'bp1', type: 'trigger', label: 'Spa Query Received', description: 'Guest seeking hair or massage slot.' },
          { id: 'bp2', type: 'action', label: 'Verify Salon Seats', description: 'Checks beauty therapist schedules.' },
          { id: 'bp3', type: 'action', label: 'Book Style Slot', description: 'Registers checkout booking keys.' }
        ],
        edges: [
          { from: 'bp1', to: 'bp2' },
          { from: 'bp2', to: 'bp3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Style inquiry', template: 'Welcome to our premium beauty sanctuary! May I book you for hair styling, nail care, or skin facials today?' },
      { scenario: 'Confirm hour slot', template: 'Perfect! I have cosmetician slots open today. What hour is ideal for your self-care session?' }
    ],
    actions: [
      { name: 'check_spa_stylists', label: 'Lookup Esthetician Slots', description: 'Queries available salon staff rosters.' },
      { name: 'book_salon_seat', label: 'Schedule Parlour Ticket', description: 'Commits client visit log.' }
    ],
    lead_capture_fields: [
      { name: 'client_name', label: 'Client Name', type: 'text', required: true },
      { name: 'beauty_service', label: 'Select Specialized Service', type: 'select', required: true, options: ['Premier Hair Cut / Styling', 'Hydrating Skin Facial', 'Gel Manicure & Pedicure', 'Full Body Therapeutic Massage'] },
      { name: 'wanted_hour', label: 'Target Arrival Hour', type: 'text', required: true },
      { name: 'stylist_gender', label: 'Therapist Choice Preferences', type: 'select', required: true, options: ['No Preference', 'Female Stylist', 'Male Stylist'] }
    ],
    ai_instructions: 'You are an elegant and relaxing salon concierge. Keep the tone calm and aesthetic, highlight beauty tips, and lock arrival hours.'
  },
  {
    id: 'clean_energy',
    name: 'Solar & Clean Energy',
    description: 'Solar micro grids lease, panel specification guides & installer rotas',
    terminology: ['monocrystalline', 'photovoltaic', 'inverter', 'microgrid', 'off-grid', 'kilowatt-hour', 'deep-cycle'],
    services: ['Residential Solar Lighting Panel', 'Deep Cycle Backup Batteries', 'Photovoltaic Solar Pumping', 'Off-Grid Commercial Solar'],
    faqs: [
      { question: 'What is the lease buy model for panels?', answer: 'We offer pay-as-you-go monocrystalline solar panels with downpayment from UGX 150,000, and weekly payments of UGX 15,000.' },
      { question: 'Does solar pumping support agriculture?', answer: 'Yes, our custom livestock and crop irrigation pump rigs support water dispatch up to 50 meters depth.' },
      { question: 'What is the warranty period for inverter appliances?', answer: 'Our solid state pure-sine inverters retain a full 2 years replacement warranty.' }
    ],
    workflows: [
      {
        name: 'Technical Grid Quote Builder',
        trigger_event: 'solar_energy_req',
        description: 'Auto reviews household power consumption specs and schedules solar audit.',
        nodes: [
          { id: 'cl1', type: 'trigger', label: 'Solar Quote Requested', description: 'Homeowner seeking clean energy grid.' },
          { id: 'cl2', type: 'action', label: 'Evaluate Grid Volume', description: 'Multiplies active TV/Fridge power indexes.' },
          { id: 'cl3', type: 'action', label: 'Catalog energy lead', description: 'Files inspection technician roster.' }
        ],
        edges: [
          { from: 'cl1', to: 'cl2' },
          { from: 'cl2', to: 'cl3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Power issues greeting', template: 'Switch to reliable solar power! We supply pure-sine inverters and monocrystalline cells. What household appliances are you looking to power?' },
      { scenario: 'Schedule installer', template: 'Excellent, we provide complete farm site technical setups. Where is the property located?' }
    ],
    actions: [
      { name: 'check_solar_batteries', label: 'Query Inverter Stocks', description: 'Matches battery pack stock indexes.' },
      { name: 'schedule_solar_technician', label: 'Commit Installation Inspection', description: 'Locks inspector travel hours.' }
    ],
    lead_capture_fields: [
      { name: 'site_owner', label: 'Homeowner Name', type: 'text', required: true },
      { name: 'electric_loads', label: 'Active Appliances (e.g. 5 Bulbs, 1 TV, Fridge)', type: 'text', required: true },
      { name: 'solar_pay_mode', label: 'Payment Preference', type: 'select', required: true, options: ['Pay-As-You-Go Lease', 'Full Outright Purchase'] },
      { name: 'address_district', label: 'Installation House District', type: 'text', required: true }
    ],
    ai_instructions: 'You are a clean energy advisor. Focus on monocrystalline battery specs, clarify PayGo lease tiers (UGX 150k deposit), and secure installation spots.'
  },
  {
    id: 'agribusiness',
    name: 'Agribusiness & Farm Inputs',
    description: 'Hybrid crop seed bags, compound animal crop feeds & veterinarian visits',
    terminology: ['cultivar', 'fertilizer-NPK', 'layer-mash', 'silage', 'veterinary', 'fungicide', 'hatchery'],
    services: ['Hybrid Cultivar Seeds Supply', 'Layer Mash Broiler Feed', 'NPK Fertilizers wholesale', 'On-Farm Veterinary Consults'],
    faqs: [
      { question: 'What hybrid grain cultivars do you stock?', answer: 'We stock hybrid high-yield maize Longe 10H and drought-tolerant sorghum seeds (UGX 7,500 per kg bag).' },
      { question: 'What is the bulk price for NPK fertilizer bags?', answer: 'Our standard 50kg wholesale bags of NPK 17:17:17 are priced at UGX 110,000.' },
      { question: 'How can on-farm veterinary help be requested?', answer: 'We route clinical poultry and livestock veterinarians fields visits to Kampala districts (UGX 40,000 per visit).' }
    ],
    workflows: [
      {
        name: 'Farm Quote Generator',
        trigger_event: 'agriculture_inputs_req',
        description: 'Estimates livestock feeds tons, adds NPK pricing, and files transport log.',
        nodes: [
          { id: 'ag1', type: 'trigger', label: 'Agri Quote requested', description: 'Farmer wants stock fertilizer details.' },
          { id: 'ag2', type: 'action', label: 'Verify Seed Silos', description: 'Queries grain inventory vaults.' },
          { id: 'ag3', type: 'action', label: 'Book Vet Doctor', description: 'Schedules veterinary fields route.' }
        ],
        edges: [
          { from: 'ag1', to: 'ag2' },
          { from: 'ag2', to: 'ag3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Seed quote query', template: 'Grow your farm yields! We supply poultry feeds, NPK fertilizers, and hybrid seeds. Are you farming crops or running livestock?' },
      { scenario: 'Vet doctor booking', template: 'Sure, I will schedule our poultry vet specialist. What symptoms are active in your farm flocks?' }
    ],
    actions: [
      { name: 'lookup_silo_bags', label: 'Query Grain Fertilizers Racks', description: 'Checks NPK bags stock counts.' },
      { name: 'book_vet_visit', label: 'Secure Veterinary Route', description: 'Locks vet travels agenda.' }
    ],
    lead_capture_fields: [
      { name: 'farmer_name', label: 'Farmer Full Name', type: 'text', required: true },
      { name: 'farm_type', label: 'Acreage Theme', type: 'select', required: true, options: ['Poultry Farm', 'Banana/Maize Crop Farm', 'Mix Livestock Dairy', 'Commercial Greenhouse'] },
      { name: 'inputs_needed', label: 'Feeds/Fertilizers and Seed Bags needed', type: 'text', required: true },
      { name: 'farm_district', label: 'Farm Location District & Village', type: 'text', required: true }
    ],
    ai_instructions: 'You are a warm, down-to-earth agriculture supply specialist. Highlight grain yield benefits, quote NPK fees (UGX 110k), and capture farm districts.'
  },
  {
    id: 'fitness_gym',
    name: 'Gym & Fitness Clubs',
    description: 'Workouts memberships cards, personal gym coaches & aerobics rotas',
    terminology: ['cardio', 'hypertrophy', 'aerobics', 'calisthenics', 'membership-pass', 'sauna', 'metabolic'],
    services: ['Monthly Premium Gym Card', 'Aerobics Yoga Routines', 'Hypertrophy Personal Train', 'Sauna Steam Baths'],
    faqs: [
      { question: 'What is the monthly active membership rate?', answer: 'Our monthly premium card is UGX 120,000 including cardio equipment, weight room, and steam sauna.' },
      { question: 'Are personal coaches available for strength training?', answer: 'Yes, custom hypertrophy lessons with fitness instructors start at UGX 15,000 per daily check-in session.' },
      { question: 'Are aerobics group sessions open?', answer: 'Group functional circuits run Mon-Wed-Fri evenings starting at 6:00 PM.' }
    ],
    workflows: [
      {
        name: 'Gym Pass Registrar',
        trigger_event: 'gym_membership_signup',
        description: 'Secures fit level criteria, checks personal coaches hours, and submits badge files.',
        nodes: [
          { id: 'gy1', type: 'trigger', label: 'Membership Inquiry', description: 'Client seeks gym admission details.' },
          { id: 'gy2', type: 'action', label: 'Verify Coach Rota', description: 'Queries trainer hourly spots.' },
          { id: 'gy3', type: 'action', label: 'Generate Gym Member Card', description: 'Prepares client digital files.' }
        ],
        edges: [
          { from: 'gy1', to: 'gy2' },
          { from: 'gy2', to: 'gy3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Gym onboarding', template: 'Get fit with us! We have weight rooms, steam saunas, and aerobics classes. Would you like a daily session ticket or a monthly membership?' },
      { scenario: 'Book coach', template: 'Excellent, I will align a fitness instructor for your session. What goals (e.g. cardio, muscle growth) are you targeting?' }
    ],
    actions: [
      { name: 'check_coach_roster', label: 'Lookup Fitness Coaches', description: 'Queries fit coaches calendars.' },
      { name: 'register_gym_pass', label: 'Commit Gym Registration', description: 'Assigns digital visitor cards.' }
    ],
    lead_capture_fields: [
      { name: 'fit_client', label: 'Athlete Full Name', type: 'text', required: true },
      { name: 'gym_goals', label: 'Fitness & Health Target', type: 'select', required: true, options: ['Weight Loss / Cardio', 'Muscle Growth / Hypertrophy', 'Yoga & Flexibility', 'General Wellnes'] },
      { name: 'card_frequency', label: 'Membership Badge choice', type: 'select', required: true, options: ['Daily Guest Pass (UGX 10k)', 'Monthly Full Pass (UGX 120k)', 'Annual Elite Pass'] },
      { name: 'sauna_pass', label: 'Include Steam & Sauna access?', type: 'select', required: true, options: ['Yes, please', 'No, weights only'] }
    ],
    ai_instructions: 'You are an energetic and motivating gym host. Focus on our 120k/month premium package, emphasize steam sauna benefits, and capture body goals.'
  },
  {
    id: 'tourism_safari',
    name: 'Tourism & Safaris',
    description: 'Gorilla trekking vouchers, wildlife game travels & hotel transits',
    terminology: ['safari', 'gorilla-trek', 'itinerary', 'game-drive', 'boma', 'rands', 'Entebbe-transit'],
    services: ['Queen Elizabeth Game Drive', 'Bwindi Gorilla Trek Tour', 'Chimpanzee Forest Safari', 'Entebbe Transit Bus'],
    faqs: [
      { question: 'Do you secure Bwindi Gorilla trekking permits?', answer: 'Yes! We coordinate Gorilla tracking permits within Bwindi Impenetrable National Forest starting from USD 700.' },
      { question: 'What is included in game safari packages?', answer: 'Our standard Queen Elizabeth tours cover a 4x4 cruiser, wildlife game drives, driver tours guide, hotel stays, and entry permits.' },
      { question: 'How is Entebbe airport booking organized?', answer: 'Our company arranges comfortable tourism cruiser transits directly to lodges.' }
    ],
    workflows: [
      {
        name: 'Travel Itinerary Constructor',
        trigger_event: 'safari_booking_request',
        description: 'Collects touring group count, date schedules, and issues custom game travel logs.',
        nodes: [
          { id: 'ts1', type: 'trigger', label: 'Safari Plan Request', description: 'Traveler wants wildlife itineraries.' },
          { id: 'ts2', type: 'action', label: 'Verify Park Lodges', description: 'Schedules room bookings in parks.' },
          { id: 'ts3', type: 'action', label: 'Submit Tour Ledger', description: 'Files traveler credentials to CRM.' }
        ],
        edges: [
          { from: 'ts1', to: 'ts2' },
          { from: 'ts2', to: 'ts3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Safari inquiry greeting', template: 'Explore Uganda\'s wilderness! We coordinate Bwindi Gorilla tours and Queen Elizabeth wildlife safaris. How many travelers are joining the tour?' },
      { scenario: 'Gorilla tracking permits', template: 'To lock down Bwindi Gorilla permits (which sell out 3 months in advance), what dates are you targeting?' }
    ],
    actions: [
      { name: 'verify_cruiser_cars', label: 'Search Available 4x4 Cars', description: 'Queries land cruiser roster.' },
      { name: 'reserve_safari_dates', label: 'Register Travel Itinerary', description: 'Computes USD trip invoice.' }
    ],
    lead_capture_fields: [
      { name: 'traveler_lead', label: 'Lead Traveler Name', type: 'text', required: true },
      { name: 'trip_category', label: 'Preferred Safari Package', type: 'select', required: true, options: ['Bwindi Gorilla Tracking Tour', 'Queen Elizabeth Game Drive', 'Murchison Falls Scenic Safari'] },
      { name: 'travelers_count', label: 'Number of Guests Joining', type: 'number', required: true },
      { name: 'travel_date', label: 'Proposed Vacation Date', type: 'text', required: true }
    ],
    ai_instructions: 'You are an inspiring safari vacation planner. Highlight Pearl of Africa landscapes, stress early bird gorilla bookings, and compute safari costs in USD/UGX.'
  },
  {
    id: 'events_decor',
    name: 'Events & Decor Rentals',
    description: 'Chairs tents sound systems lease, wedding decor grids & custom quotes',
    terminology: ['tents-gazebo', 'draping', 'canopy', 'sound-mixer', 'rigging', 'tables-round', 'venue-decoration'],
    services: ['Wedding Venue Decoration', 'Gazebo High-Peak Tents', 'Premium Sound Rigging', 'Round Banquet Tables'],
    faqs: [
      { question: 'What is the hire rate for high-peak tents?', answer: 'Our standard 100-seater high-peak dome tents are hired at UGX 150,000 per day.' },
      { question: 'Do you offer sound mixer rigging packages?', answer: 'Yes! Sound system rentals including wireless mics, subwoofers, and active operators start at UGX 250,000 per evening.' },
      { question: 'Is venue draping decoration included in prices?', answer: 'We structure custom venue decoration options starting from UGX 500,000 including stages and floral pillars.' }
    ],
    workflows: [
      {
        name: 'Event Rental Tracker',
        trigger_event: 'event_rentals_signup',
        description: 'Auto lists guest chairs counts, compiles sound/tent rental costs, and blocks dates.',
        nodes: [
          { id: 'ev1', type: 'trigger', label: 'Decoration Inquiry', description: 'Planner queries wedding rentals pricing.' },
          { id: 'ev2', type: 'action', label: 'Check Chairs Storage', description: 'Queries gazebo stock levels in warehouse.' },
          { id: 'ev3', type: 'action', label: 'Commit Event Date', description: 'Secures contract booking files.' }
        ],
        edges: [
          { from: 'ev1', to: 'ev2' },
          { from: 'ev2', to: 'ev3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Wedding decoration help', template: 'Congratulations! Let\'s design an unforgettable event. Are you seeking canopy decor, sound mixers, high-peak tents, or round banquet tables?' },
      { scenario: 'Confirm guests size', template: 'Wonderful. How many guest chairs and tables should we allocate for your ceremony layout?' }
    ],
    actions: [
      { name: 'query_chairs_inventory', label: 'Verify Gazebo Storage levels', description: 'Checks open chairs balances.' },
      { name: 'lock_celebration_date', label: 'Submit Event Reservation', description: 'Saves event logs to CRM.' }
    ],
    lead_capture_fields: [
      { name: 'event_host', label: 'Organizer Name', type: 'text', required: true },
      { name: 'occasion_theme', label: 'Celebrate Event Theme', type: 'select', required: true, options: ['Wedding Reception', 'Introduction Ceremony (Kwanjula)', 'Corporate Banquet Dinner', 'Graduation / Birthday Party'] },
      { name: 'guests_capacity', label: 'Target Crowd (Number of Chairs)', type: 'number', required: true },
      { name: 'venue_town', label: 'Event Venue physical address', type: 'text', required: true }
    ],
    ai_instructions: 'You are an artistic and organized event decorator. Focus on elegant themes (Kwanjula details), list rental equipment options, and check gazebo stock limits.'
  },
  {
    id: 'waste_mgmt',
    name: 'Waste & Sanitation',
    description: 'Residential garbage pickup rotas, recycling plastic scales & rates logs',
    terminology: ['sanitation', 'garbage-wheelie', 'incinerate', 'recyclable', 'landfill', 'haulage', 'municipal'],
    services: ['Residential Garbage Pickup', 'Commercial Dumpster Haulage', 'Hazardous Waste Incinerate', 'Plastic Recycling scales'],
    faqs: [
      { question: 'What are the fees for residential garbage pick-up?', answer: 'We service weekly residential trash pickups for UGX 30,000 per month, utilizing standard 240L wheelie bins.' },
      { question: 'What is the bulk schedule for recycling?', answer: 'We buy standard PET plastic bottles by weight scales at UGX 450 per standard dry kilogram.' },
      { question: 'How do you discard hazardous medical waste?', answer: 'We operate certified high-temperature incinerators following municipal environmental standards.' }
    ],
    workflows: [
      {
        name: 'Bin Dispatch Scheduler',
        trigger_event: 'waste_pickup_request',
        description: 'Secures household locality and schedules standard sanitation compaction trucks.',
        nodes: [
          { id: 'ws1', type: 'trigger', label: 'Trash collection requested', description: 'Resident seeks garbage pickup registration.' },
          { id: 'ws2', type: 'action', label: 'Map Compactor Routes', description: 'Checks garbage truck schedules in Kampala.' },
          { id: 'ws3', type: 'action', label: 'Deliver Wheelie Bin', description: 'Saves subscriber address parameters.' }
        ],
        edges: [
          { from: 'ws1', to: 'ws2' },
          { from: 'ws2', to: 'ws3' }
        ]
      }
    ],
    suggested_responses: [
      { scenario: 'Sanitation onboarding', template: 'Keep your neighborhood clean! We run weekly residential garbage pickups. Would you like us to dispatch a 240L wheelie bin to your home?' },
      { scenario: 'Recycling weight query', template: 'Excellent, we support plastic collection. How many clean PET plastic kilograms are you looking to exchange?' }
    ],
    actions: [
      { name: 'find_pickup_route', label: 'Track Sanitation Trucks', description: 'Locates compaction vehicle routes.' },
      { name: 'schedule_dumpster_haulage', label: 'Register Garbage Subscriber', description: 'Marks dumpster checks on GPS charts.' }
    ],
    lead_capture_fields: [
      { name: 'household_head', label: 'Householder Full Name', type: 'text', required: true },
      { name: 'customer_class', label: 'Account Tier', type: 'select', required: true, options: ['Residential Home Subscriber', 'Commercial Restaurant/Office', 'Industrial Factory Haulage'] },
      { name: 'bins_count', label: 'Number of Bins Wanted', type: 'number', required: true },
      { name: 'residency_address', label: 'Physical Street / Village Address', type: 'text', required: true }
    ],
    ai_instructions: 'You are a professional and clean public health sanitation operator. Focus on weekly truck routes, explain billing monthly cycles (UGX 30k), and record pickup spots.'
  }
];
