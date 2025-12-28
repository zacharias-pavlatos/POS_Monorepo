/**
 * Configures OpenAPI documentation for the application.
 *
 * Sets up two documentation endpoints:
 * - `/doc`: Generates a raw OpenAPI 3.0.0 schema in JSON format that describes all API endpoints,
 *   request/response models, authentication methods, and other metadata.
 * - `/scalar`: Serves an interactive API reference UI powered by Scalar, which reads the OpenAPI
 *   schema and provides a user-friendly interface for exploring and testing API endpoints. Users can
 *   make live API requests directly from the documentation, view detailed request/response examples,
 *   and browse organized endpoint documentation.
 *
 * API version is automatically synced from package.json to ensure documentation stays current.
 */

// import packageJSON from '@root/package.json';
// import { Scalar } from '@scalar/hono-api-reference';

// import { auth } from './auth/auth';

// import type { AppOpenAPI } from './types';

// export default function configureOpenAPI(app: AppOpenAPI) {
//   app.doc('/doc', {
//     openapi: '3.0.0',
//     info: {
//       // TODO: Update title and other info as needed
//       title: 'My API',
//       description: 'RESTful API for [service description]',
//       // Automatically synced from package.json app version
//       version: packageJSON.version,
//     },
//   });

//   // Better Auth schema endpoint
//   app.get('/auth-schema', async c => {
//     const schema = await auth.api.generateOpenAPISchema();

//     // Schema can be filtered here to remove unwanted path from the OpenApi docs
//     // Log all paths to see what's included
//     // console.log("OpenAPI paths:", Object.keys(schema.paths));
//     return c.json(schema);
//   });

//   // Combined Scalar UI showing both APIs
//   app.get(
//     '/scalar',
//     Scalar({
//       url: '/doc',
//       theme: 'kepler',
//       defaultHttpClient: {
//         targetKey: 'javascript',
//         clientKey: 'fetch',
//       },
//       sources: [
//         {
//           url: '/doc',
//           title: 'Main API',
//         },
//         {
//           url: '/auth-schema',
//           title: 'Authentication',
//         },
//       ],
//     })
//   );
// }
