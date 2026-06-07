export const BOOKING_TOKEN_RATE = 0.2;
export const BOOKING_TOKEN_MINIMUM = 20;

export interface BookingTokenBreakdown {
  sellerQuote: number;
  bookingToken: number;
  buyerTotal: number;
  onsiteDue: number;
}

export function calculateBookingTokenBreakdown(amount: number): BookingTokenBreakdown {
  const sellerQuote = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const percentageFee = sellerQuote * BOOKING_TOKEN_RATE;
  const bookingToken = sellerQuote > 0 ? Math.max(percentageFee, BOOKING_TOKEN_MINIMUM) : 0;

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
