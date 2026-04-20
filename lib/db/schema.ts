import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ============================================
// ENUMS
// ============================================

export const shipmentStatus = pgEnum("shipment_status", [
  "RECEIVED_AT_WAREHOUSE",
  "BATCHED",
  "IN_TRANSIT",
  "ARRIVED_AT_PORT",
  "AVAILABLE_FOR_PICKUP",
  "PICKED_UP",
  "DELIVERED",
]);

export const batchType = pgEnum("batch_type", ["AIR", "SEA"]);

export const currency = pgEnum("currency", ["USD", "RMB", "GHS"]);

export const invoiceStatus = pgEnum("invoice_status", [
  "DRAFT",
  "ISSUED",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
  "CANCELLED",
]);

// ============================================
// CORE TABLES
// ============================================

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================
// EXCHANGE RATES - Converts USD to GHS or RMB
// ============================================

export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCurrency: currency("from_currency").notNull().default("USD"),
  toCurrency: currency("to_currency").notNull(),
  rate: numeric("rate", { precision: 10, scale: 4 }).notNull(),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => user.id),
});

// ============================================
// PRICE RATES - Shipping rates (always in USD)
// ============================================

export const priceRates = pgTable("price_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: batchType("type").notNull(),
  name: text("name").notNull(),
  pricePerKgUSD: numeric("price_per_kg_usd", {
    precision: 10,
    scale: 2,
  }).notNull(),
  pricePerCbmUSD: numeric("price_per_cbm_usd", {
    precision: 10,
    scale: 2,
  }).notNull(),
  minimumChargeUSD: numeric("minimum_charge_usd", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  exchangeRateGHSId: uuid("exchange_rate_ghs_id")
    .notNull()
    .references(() => exchangeRates.id),
  exchangeRateRMBId: uuid("exchange_rate_rmb_id")
    .notNull()
    .references(() => exchangeRates.id),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => user.id),
});

// ============================================
// BATCHES
// ============================================

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchNumber: text("batch_number").notNull().unique(),
  type: batchType("type").notNull(),
  status: text("status").notNull().default("PENDING"),
  containerSize: text("container_size"),
  estimatedDeparture: timestamp("estimated_departure"),
  estimatedArrival: timestamp("estimated_arrival"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => user.id),
});

// ============================================
// SHIPMENTS
// ============================================

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackingNumber: text("tracking_number").notNull().unique(),
  itemNumber: text("item_number"),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  batchId: uuid("batch_id").references(() => batches.id),
  priceRateId: uuid("price_rate_id")
    .notNull()
    .references(() => priceRates.id),
  status: shipmentStatus("status").notNull().default("RECEIVED_AT_WAREHOUSE"),
  packages: numeric("packages", { precision: 10, scale: 0 })
    .notNull()
    .default("1"),
  weight: numeric("weight", { precision: 10, scale: 2 }),
  cbm: numeric("cbm", { precision: 10, scale: 4 }),
  estimatedArrival: timestamp("estimated_arrival"),
  notes: text("notes"),
  totalChargeUSD: numeric("total_charge_usd", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => user.id),
});

// ============================================
// INVOICES - Generated when shipment is created
// ============================================

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipments.id)
    .unique(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  priceRateId: uuid("price_rate_id")
    .notNull()
    .references(() => priceRates.id),
  invoiceCurrency: currency("invoice_currency").notNull().default("GHS"),
  exchangeRateId: uuid("exchange_rate_id").references(() => exchangeRates.id),
  exchangeRateUsed: numeric("exchange_rate_used", { precision: 10, scale: 4 }),

  // Base charges in USD
  baseWeightChargeUSD: numeric("base_weight_charge_usd", {
    precision: 10,
    scale: 2,
  }).notNull(),
  baseCbmChargeUSD: numeric("base_cbm_charge_usd", {
    precision: 10,
    scale: 2,
  }).notNull(),
  baseMinimumChargeUSD: numeric("base_minimum_charge_usd", {
    precision: 10,
    scale: 2,
  }).notNull(),
  baseSubtotalUSD: numeric("base_subtotal_usd", {
    precision: 10,
    scale: 2,
  }).notNull(),

  // Display charges in selected currency
  weightCharge: numeric("weight_charge", { precision: 10, scale: 2 }).notNull(),
  cbmCharge: numeric("cbm_charge", { precision: 10, scale: 2 }).notNull(),
  minimumCharge: numeric("minimum_charge", {
    precision: 10,
    scale: 2,
  }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),

  // Payment tracking
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  balanceDue: numeric("balance_due", { precision: 10, scale: 2 }).notNull(),

  status: invoiceStatus("status").notNull().default("DRAFT"),
  dueDate: timestamp("due_date"),
  issuedAt: timestamp("issued_at"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdBy: text("created_by").references(() => user.id),
});

// ============================================
// INVOICE LINE ITEMS - Detailed breakdown
// ============================================

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// PAYMENTS - Linked to invoices
// ============================================

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currency("currency").notNull(),
  paymentMethod: text("payment_method").notNull().default("CASH"),
  transactionReference: text("transaction_reference"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => user.id),
});

// ============================================
// RELATIONS
// ============================================

export const clientsRelations = relations(clients, ({ many }) => ({
  shipments: many(shipments),
  invoices: many(invoices),
  payments: many(payments),
}));

export const batchesRelations = relations(batches, ({ many }) => ({
  shipments: many(shipments),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ many }) => ({
  priceRatesGHS: many(priceRates, { relationName: "exchangeRateGHS" }),
  priceRatesRMB: many(priceRates, { relationName: "exchangeRateRMB" }),
  invoices: many(invoices),
}));

export const priceRatesRelations = relations(priceRates, ({ one, many }) => ({
  exchangeRateGHS: one(exchangeRates, {
    fields: [priceRates.exchangeRateGHSId],
    references: [exchangeRates.id],
    relationName: "exchangeRateGHS",
  }),
  exchangeRateRMB: one(exchangeRates, {
    fields: [priceRates.exchangeRateRMBId],
    references: [exchangeRates.id],
    relationName: "exchangeRateRMB",
  }),
  shipments: many(shipments),
  invoices: many(invoices),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  client: one(clients, {
    fields: [shipments.clientId],
    references: [clients.id],
  }),
  batch: one(batches, {
    fields: [shipments.batchId],
    references: [batches.id],
  }),
  priceRate: one(priceRates, {
    fields: [shipments.priceRateId],
    references: [priceRates.id],
  }),
  invoice: one(invoices, {
    fields: [shipments.id],
    references: [invoices.shipmentId],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  shipment: one(shipments, {
    fields: [invoices.shipmentId],
    references: [shipments.id],
  }),
  priceRate: one(priceRates, {
    fields: [invoices.priceRateId],
    references: [priceRates.id],
  }),
  exchangeRate: one(exchangeRates, {
    fields: [invoices.exchangeRateId],
    references: [exchangeRates.id],
  }),
  lineItems: many(invoiceLineItems),
  payments: many(payments),
}));

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;

export type PriceRate = typeof priceRates.$inferSelect;
export type NewPriceRate = typeof priceRates.$inferInsert;

export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
