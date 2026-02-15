export type Locale = "it" | "en";

export function getDict(locale: Locale) {
  const it = {
    upcoming: "Eventi in arrivo",
    tickets: "Biglietti",
    buyNow: "Acquista ora",
    from: "Da",
    venue: "Luogo",
    notFound: "Evento non trovato",
    availability: "Disponibilità",
    priceTbd: "Prezzo da definire",
    language: "Lingua",
  };

  const en = {
    upcoming: "Upcoming Events",
    tickets: "Tickets",
    buyNow: "Buy Now",
    from: "From",
    venue: "Venue",
    notFound: "Event not found",
    availability: "Availability",
    priceTbd: "Price TBD",
    language: "Language",
  };

  return locale === "it" ? it : en;
}

export function formatMoney(locale: Locale, cents: number, currency = "EUR") {
  const localeTag = locale === "it" ? "it-IT" : "en-GB";
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDateTime(locale: Locale, iso: string) {
  const localeTag = locale === "it" ? "it-IT" : "en-GB";
  return new Date(iso).toLocaleString(localeTag);
}
