import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertCategorySchema,
  PatchCategorySchema,
  SelectCategorySchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const categoryContract = oc
  .prefix('/categories')
  .tag('category')
  .router({
    all: oc
      .route({
        method: 'GET',
        path: '/',
        summary: 'List all categories',
        description: 'Retrieve all categories from all users',
      })
      .output(z.array(SelectCategorySchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a category',
        description: 'Returns a single category by its unique identifier',
      })
      .errors(missingIdError)
      .input(
        z.object({
          id: z.uuid(),
        })
      )
      .output(SelectCategorySchema),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new category.',
        description:
          'Creates a new menu category. Categories are used to organize menu items into logical groups such as appetizers, entrées, or beverages.',
      })
      .input(InsertCategorySchema)
      .output(SelectCategorySchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a category.',
        description:
          'Partially updates an existing category. Only provided fields will be modified; omitted fields remain unchanged.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchCategorySchema))
      .output(SelectCategorySchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a category',
        description:
          'Permanently removes a category. This action cannot be undone. Associated menu items may need to be reassigned.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectCategorySchema),
  });

export default categoryContract;
