import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import env from '@/lib/env';
import { rpc } from '@/lib/rpc';
import type { AppBindings } from '@/lib/types';

//import { pinoLogger } from './middlewares/pino-logger';

const app = new Hono<AppBindings>();
const trustedOrigins = [env.CLIENT_URL];

// ============================================================================
// PUBLIC ROUTES (no auth required)
// ============================================================================
app.get('/', c => {
  return c.text('Hello Hono!');
});

app.get('/health', c => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// app.use(pinoLogger());
// ============================================================================
// Better Auth Routes
// ============================================================================

app.use(
  `/auth/*`,
  cors({
    origin: trustedOrigins,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  })
);

app.on(['POST', 'GET'], `/auth/*`, c => auth.handler(c.req.raw));

// ============================================================================
// API
// ============================================================================

app.use(
  `/api/*`,
  cors({
    origin: trustedOrigins,
    credentials: true,
  }),
  async (c, next) => {
    const { matched, response } = await api.handler(c.req.raw);

    if (matched) {
      return c.newResponse(response.body, response);
    }
    await next();
  }
);

// ============================================================================
// RPC
// ============================================================================

app.use(
  `/rpc/*`,
  cors({
    origin: trustedOrigins,
    credentials: true,
  }),
  async (c, next) => {
    const { matched, response } = await rpc.handler(c.req.raw);

    if (matched) {
      return c.newResponse(response.body, response);
    }
    await next();
  }
);

//----------------
serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  info => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

export default app;
