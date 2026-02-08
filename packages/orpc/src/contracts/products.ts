/**
 * /products
 *
 * Menu items that can be sold. Products belong to categories
 * and can have modifier groups for customization options.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertProductSchema,
  PatchProductSchema,
  SelectProductSchema,
  SelectModifierGroupSchema,
  SelectModifierSchema,
  SelectModifierOptionDependencySchema,
  SelectWorkStationSchema,
  SelectCategoryProductSchema,
  SelectCategorySchema,
  SelectOfferProductSchema,
  SelectOfferSchema,
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
        description: 'Retrieve all products for the organization.',
      })
      .output(z.array(SelectProductSchema)),

    search: oc
      .route({
        method: 'GET',
        path: '/search',
        summary: 'Search products by name',
        description: 'Fuzzy search products by name (case-insensitive).',
      })
      .input(z.object({ query: z.string().min(1) }))
      .output(z.array(SelectProductSchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a product',
        description: 'Returns a single product by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectProductSchema),

    oneWithModifiers: oc
      .route({
        method: 'GET',
        path: '/{id}/modifiers',
        summary: 'Retrieve a product with its modifier groups and modifiers',
        description:
          'Returns a product with modifier groups and their options, ordered by display order.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectProductSchema.extend({
          modifierGroups: z.array(
            SelectModifierGroupSchema.extend({
              modifiers: z.array(SelectModifierSchema),
            })
          ),
        })
      ),

    oneDetailed: oc
      .route({
        method: 'GET',
        path: '/{id}/detailed',
        summary:
          'Retrieve a product with full modifier tree, workstation, categories, and offers',
        description:
          'Returns a product with all related data: workstation, categories, modifier groups with modifiers and dependencies, and active offers. Designed for POS and admin detail views.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectProductSchema.extend({
          workstation: SelectWorkStationSchema.nullable(),
          categories: z.array(
            SelectCategoryProductSchema.extend({
              category: SelectCategorySchema,
            })
          ),
          modifierGroups: z.array(
            SelectModifierGroupSchema.extend({
              modifiers: z.array(
                SelectModifierSchema.extend({
                  dependencies: z.array(SelectModifierOptionDependencySchema),
                })
              ),
            })
          ),
          offers: z.array(
            SelectOfferProductSchema.extend({
              offer: SelectOfferSchema,
            })
          ),
        })
      ),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new product',
        description: 'Creates a new product. Products are the items that can be sold.',
      })
      .input(InsertProductSchema)
      .output(SelectProductSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a product',
        description:
          'Partially updates an existing product. Only provided fields will be modified.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchProductSchema))
      .output(SelectProductSchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a product',
        description: 'Permanently removes a product. This action cannot be undone.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectProductSchema),
  });

export default productContract;
