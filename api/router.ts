import { authRouter } from "./auth-router";
import { productRouter } from "./routers/product";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  product: productRouter,
});

export type AppRouter = typeof appRouter;
