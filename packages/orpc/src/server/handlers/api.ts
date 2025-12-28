/**
 * OpenAPI Handler for REST API endpoints
 *
 * This handler:
 * - Exposes oRPC procedures as REST endpoints (GET, POST, etc.)
 * - Generates interactive API documentation (Scalar UI)
 * - Handles request/response serialization
 * - Validates inputs/outputs against Zod schemas
 */

import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { onError, ORPCError, ValidationError } from '@orpc/server';
import { ZodSmartCoercionPlugin } from '@orpc/zod';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import z from 'zod';

import { appRouter } from '../routers';

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new ZodSmartCoercionPlugin(),
    // Generates OpenAPI spec + serves Scalar API documentation UI
    new OpenAPIReferencePlugin({
      // Converts Zod validation schemas → JSON Schema for OpenAPI spec
      schemaConverters: [new ZodToJsonSchemaConverter()],
      // docsProvider: 'scalar',
      specGenerateOptions: {
        info: {
          title: 'Restaurant POS API',
          version: '0.0.1',
          description: 'Multi-tenant restaurant management system',
        },
      },
      docsPath: '/docs', // Where to serve docs at api/
      specPath: '/spec.json', // Where to serve spec
    }),
  ],

  /**
   * Validation Error Interceptor
   *
   * Transforms raw validation errors into structured, client-friendly responses.
   * Handles both input and output validation failures from Zod schemas.
   *
   * Input errors (client sent bad data):
   * - Converts BAD_REQUEST → INPUT_VALIDATION_FAILED (422)
   * - Returns field-level errors for form handling
   *
   * Output errors (server returned bad data):
   * - Converts INTERNAL_SERVER_ERROR → OUTPUT_VALIDATION_FAILED (500)
   * - Logs details server-side, hides internals from client
   */

  interceptors: [
    // Log all procedure errors
    // TODO: replace with proper error tracking integration
    onError(error => {
      console.error(error);
    }),
  ],

  clientInterceptors: [
    onError(error => {
      console.log(error);
      if (!(error instanceof ORPCError) || !(error.cause instanceof ValidationError)) {
        return;
      }

      const zodError = new z.ZodError(error.cause.issues as z.core.$ZodIssue[]);

      // Input validation failed (client error)
      if (error.code === 'BAD_REQUEST') {
        throw new ORPCError('INPUT_VALIDATION_FAILED', {
          status: 422,
          message: z.prettifyError(zodError),
          data: z.flattenError(zodError),
          cause: error.cause,
        });
      }

      // Output validation failed (server error)
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('Output validation failed:', error.cause.issues);

        throw new ORPCError('OUTPUT_VALIDATION_FAILED', {
          status: 500,
          message: 'INTERNAL_SERVER_ERROR',
          cause: error.cause,
        });
      }
    }),
  ],
});
