import { pinoLogger as logger } from 'hono-pino';
import pino from 'pino';
import pretty from 'pino-pretty';

import env from '@/lib/env';

export function pinoLogger() {
  return logger({
    pino: pino(
      {
        level: env.LOG_LEVEL,
      },
      // prettify only in non-production
      env.NODE_ENV === 'production' ? undefined : pretty()
    ),
    http: {
      reqId: () => crypto.randomUUID(),
    },
  });
}
