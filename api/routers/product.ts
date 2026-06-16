import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { products } from "@db/schema";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";

export const productRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        sort: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { category, search, sort, page = 1, limit = 12 } = input ?? {};

      const conditions = [];
      if (category && category !== "all") {
        conditions.push(eq(products.category, category as "t-shirt" | "hoodie" | "sweater" | "jacket" | "tank-top" | "asset-3d"));
      }
      if (search) {
        conditions.push(like(products.name, `%${search}%`));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      let orderBy;
      switch (sort) {
        case "price-low":
          orderBy = asc(products.price);
          break;
        case "price-high":
          orderBy = desc(products.price);
          break;
        case "rating":
          orderBy = desc(products.rating);
          break;
        case "popular":
          orderBy = desc(products.reviewCount);
          break;
        default:
          orderBy = desc(products.createdAt);
      }

      const [items, countResult] = await Promise.all([
        db
          .select()
          .from(products)
          .where(where)
          .orderBy(orderBy)
          .limit(limit)
          .offset((page - 1) * limit),
        db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(where),
      ]);

      const total = countResult[0]?.count ?? 0;

      return {
        products: items,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),
});
