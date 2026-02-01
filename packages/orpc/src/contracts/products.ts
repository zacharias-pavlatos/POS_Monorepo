import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  ProductInsertSchema,
  ProductSelectSchema,
  ProductUpdateSchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const productContract = oc
  .prefix('/products')
  .tag('product')
  .router({
    all: oc
      .route({
        method: 'GET',
        path: '/',
        summary: 'List all products',
        description: 'Retrieve all products from the organization',
      })
      .output(z.array(ProductSelectSchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a product',
        description: 'Returns a single product by its unique identifier',
      })
      .errors(missingIdError)
      .input(
        z.object({
          id: z.uuid(),
        })
      )
      .output(ProductSelectSchema),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new product.',
        description:
          'Creates a new product. Products are the items that can be sold.',
      })
      .input(ProductInsertSchema)
      .output(ProductSelectSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a product.',
        description:
          'Partially updates an existing product. Only provided fields will be modified; omitted fields remain unchanged.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(ProductUpdateSchema))
      .output(ProductSelectSchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a product',
        description:
          'Permanently removes a product. This action cannot be undone.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(ProductSelectSchema),
  });

export default productContract;
