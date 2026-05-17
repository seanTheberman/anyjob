export const BOOKING_TOKEN_RATE = 0.2;
export const BOOKING_TOKEN_CAP = 40;

export interface BookingTokenBreakdown {
  sellerQuote: number;
  bookingToken: number;
  buyerTotal: number;
  onsiteDue: number;
}

export function calculateBookingTokenBreakdown(amount: number): BookingTokenBreakdown {
  const sellerQuote = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const bookingToken = Math.min(sellerQuote * BOOKING_TOKEN_RATE, BOOKING_TOKEN_CAP);

  return {
    sellerQuote,
    bookingToken,
    buyerTotal: sellerQuote + bookingToken,
    onsiteDue: sellerQuote,
  };
}

export function formatMoney(amount: number, currency = "€") {
  return `${currency}${amount.toFixed(2)}`;
}
