/** Mirrors Oms\OrderController::ORDER_STATUSES, in workflow order. */
export const ORDER_STATUSES = [
  'pending',
  'in_progress',
  'ready_to_ship',
  'in_transit',
  'reached_the_destination',
  'delivered',
  'hold',
  'cancelled',
  'ready_to_return',
  'return_in_transit',
  'return_in_destination',
  'return_received',
  'replacement_pending',
  'replacement_in_transit',
  'replacement_in_destination',
  'replacement_received',
  'replacement_sendback_in_transit',
  'replacement_completed',
];

/** The order list's filter chips (the common statuses). */
export const ORDER_FILTERS = ['pending', 'in_progress', 'ready_to_ship', 'in_transit', 'reached_the_destination', 'delivered', 'hold', 'cancelled'];

export const PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'refunded', 'failed'];

/** Oms\Lead::STATUSES */
export const LEAD_STATUSES = ['new', 'interested', 'sales_lost', 'won'];

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  interested: 'Interested',
  sales_lost: 'Sales Lost',
  won: 'Won',
};

export const REMINDER_STATUSES = ['today', 'overdue', 'upcoming', 'complete'];

export const REMINDER_STATUS_LABELS: Record<string, string> = {
  today: "Today's Work",
  overdue: 'Overdue',
  upcoming: 'Upcoming',
  complete: 'Complete',
};

export const REMINDER_TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  it_service: 'IT Service',
  tour_booking: 'Tour Booking',
  realestate_marketing: 'Real Estate Marketing',
};

export const ENQUIRY_STATUSES = ['new', 'contacted', 'converted', 'closed'];
