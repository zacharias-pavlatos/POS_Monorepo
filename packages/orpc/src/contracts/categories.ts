/**
 * /categories
 *
 * Menu categories that organize products into logical groups.
 * Each category is assigned to a workstation for kitchen routing
 * and can belong to one or more catalogs.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertCategorySchema,
  PatchCategorySchema,
  SelectCategorySchema,
  SelectCategoryProductSchema,
  InsertCategoryProductSchema,
  SelectProductSchema,
  SelectModifierGroupSchema,
  SelectModifierSchema,
  SelectModifierOptionDependencySchema,
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
        description: 'Retrieve all categories for the organization.',
      })
      .output(z.array(SelectCategorySchema)),

    byCatalog: oc
      .route({
        method: 'GET',
        path: '/by-catalog/{catalogId}',
        summary: 'List categories for a catalog',
        description:
          'Retrieve all active categories belonging to a specific catalog, ordered by serving order.',
      })
      .input(z.object({ catalogId: z.uuid() }))
      .output(z.array(SelectCategorySchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a category',
        description: 'Returns a single category by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectCategorySchema),

    oneWithProducts: oc
      .route({
        method: 'GET',
        path: '/{id}/products',
        summary: 'Retrieve a category with its products',
        description:
          'Returns a category with all linked products, ordered by display order.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectCategorySchema.extend({
          products: z.array(
            SelectProductSchema.extend({
              displayOrder: z.number().int(),
            })
          ),
        })
      ),

    oneDetailed: oc
      .route({
        method: 'GET',
        path: '/{id}/full',
        summary: 'Retrieve a category with full product and modifier tree',
        description:
          'Returns a category with products, each product with its modifier groups, modifiers, and dependencies. Designed for POS checkout rendering.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectCategorySchema.extend({
          products: z.array(
            SelectProductSchema.extend({
              displayOrder: z.number().int(),
              modifierGroups: z.array(
                SelectModifierGroupSchema.extend({
                  modifiers: z.array(
                    SelectModifierSchema.extend({
                      dependencies: z.array(SelectModifierOptionDependencySchema),
                    })
                  ),
                })
              ),
            })
          ),
        })
      ),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new category',
        description:
          'Creates a new menu category. Categories organize menu items into logical groups such as appetizers, entrées, or beverages.',
      })
      .input(InsertCategorySchema)
      .output(SelectCategorySchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a category',
        description:
          'Partially updates an existing category. Only provided fields will be modified.',
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
          'Permanently removes a category. Associated products may need to be reassigned.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectCategorySchema),

    // ── Product junction ─────────────────────────────────────────────

    addProduct: oc
      .route({
        method: 'POST',
        path: '/{categoryId}/products',
        summary: 'Link a product to a category',
        description: 'Associates a product with this category via the junction table.',
      })
      .input(z.object({ categoryId: z.uuid() }).and(InsertCategoryProductSchema))
      .output(SelectCategoryProductSchema),

    removeProduct: oc
      .route({
        method: 'DELETE',
        path: '/{categoryId}/products/{productId}',
        summary: 'Unlink a product from a category',
        description: 'Removes the association between a product and this category.',
      })
      .input(z.object({ categoryId: z.uuid(), productId: z.uuid() }))
      .output(SelectCategoryProductSchema),

    updateProductOrder: oc
      .route({
        method: 'PATCH',
        path: '/{categoryId}/products/{productId}/order',
        summary: 'Update product display order within a category',
        description: 'Changes the display order of a product within a category.',
      })
      .input(
        z.object({
          categoryId: z.uuid(),
          productId: z.uuid(),
          displayOrder: z.number().int().min(0),
        })
      )
      .output(SelectCategoryProductSchema),
  });

export default categoryContract;
