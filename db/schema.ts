import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  int,
  json,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// Users table (managed by auth system)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  plan: mysqlEnum("plan", ["free", "premium"]).default("free").notNull(),
  planExpiry: timestamp("planExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "t-shirt",
    "hoodie",
    "sweater",
    "jacket",
    "tank-top",
    "asset-3d",
  ]).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  colors: json("colors").$type<string[]>(),
  sizes: json("sizes").$type<string[]>(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0").notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  image: varchar("image", { length: 500 }),
  creatorId: bigint("creatorId", { mode: "number", unsigned: true }),
  creatorName: varchar("creatorName", { length: 255 }),
  isNew: boolean("isNew").default(false).notNull(),
  isCustomizable: boolean("isCustomizable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Designs table
export const designs = mysqlTable("designs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull(),
  productId: bigint("productId", { mode: "number", unsigned: true })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  designData: json("designData").notNull(),
  previewImage: varchar("previewImage", { length: 500 }),
  color: varchar("color", { length: 50 }),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Design = typeof designs.$inferSelect;
export type InsertDesign = typeof designs.$inferInsert;

// Orders table
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", [
    "diproses",
    "dikirim",
    "selesai",
    "dibatalkan",
  ])
    .default("diproses")
    .notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  promoCode: varchar("promoCode", { length: 50 }),
  shippingAddress: json("shippingAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Order items table
export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true })
    .notNull(),
  productId: bigint("productId", { mode: "number", unsigned: true })
    .notNull(),
  designId: bigint("designId", { mode: "number", unsigned: true }),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  color: varchar("color", { length: 50 }),
  size: varchar("size", { length: 20 }),
  isCustomDesign: boolean("isCustomDesign").default(false).notNull(),
  previewImage: varchar("previewImage", { length: 500 }),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// Wishlist table
export const wishlist = mysqlTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull(),
  productId: bigint("productId", { mode: "number", unsigned: true })
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WishlistItem = typeof wishlist.$inferSelect;
export type InsertWishlistItem = typeof wishlist.$inferInsert;

// Cart items table
export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  sessionId: varchar("sessionId", { length: 255 }),
  productId: bigint("productId", { mode: "number", unsigned: true })
    .notNull(),
  designId: bigint("designId", { mode: "number", unsigned: true }),
  quantity: int("quantity").default(1).notNull(),
  color: varchar("color", { length: 50 }),
  size: varchar("size", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// Reviews table
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  productId: bigint("productId", { mode: "number", unsigned: true })
    .notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull(),
  userName: varchar("userName", { length: 255 }),
  userAvatar: varchar("userAvatar", { length: 500 }),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
