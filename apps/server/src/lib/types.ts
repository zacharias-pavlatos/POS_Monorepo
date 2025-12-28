import type { auth } from './auth';
import type { PinoLogger } from 'hono-pino';

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}
