import { oc } from '@orpc/contract';

import categoryContract from './categories';

export const appContract = oc
  .errors({
    INPUT_VALIDATION_FAILED: {
      status: 422,
    },
    BAD_REQUEST: {
      status: 400,
      message: 'Invalid request',
    },
    UNAUTHORIZED: {
      status: 401,
      message: 'Missing user session. Please log in!',
    },
    FORBIDDEN: {
      status: 403,
      message: 'You do not have enough permission to perform this action.',
    },
    NOT_FOUND: {
      status: 404,
      message: 'Resource not found',
    },
    CONFLICT: {
      status: 409,
      message: 'Resource already exists',
    },
  })
  .router({
    categories: categoryContract,
  });
