/**
 * /catalogs
 *
 * Menu collections that group categories with time-based availability.
 * A restaurant might have separate breakfast, lunch, and dinner catalogs,
 * each containing different category sets and active during different hours.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertCatalogSchema,
  PatchCatalogSchema,
  SelectCatalogSchema,
  SelectCategorySchema,
  SelectCategoryProductSchema,
  SelectProductSchema,
  SelectModifierGroupSchema,
  SelectModifierSchema,
  SelectModifierOptionDependencySchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const catalogContract = oc
  .prefix('/catalogs')
  .tag('catalog')
  .router({
    all: oc
      .route({
        method: 'GET',
        path: '/',
        summary: 'List all catalogs',
        description: 'Retrieve all catalogs for the organization.',
      })
      .output(z.array(SelectCatalogSchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a catalog',
        description: 'Returns a single catalog by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectCatalogSchema),

    oneWithCategories: oc
      .route({
        method: 'GET',
        path: '/{id}/categories',
        summary: 'Retrieve a catalog with its categories',
        description:
          'Returns a catalog with all its associated categories, ordered by serving order.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectCatalogSchema.extend({
          categories: z.array(SelectCategorySchema),
        })
      ),

    oneDetailed: oc
      .route({
        method: 'GET',
        path: '/{id}/detailed',
        summary: 'Retrieve a catalog with full menu tree',
        description:
          'Returns a catalog with categories, products, modifier groups, modifiers, and dependencies. Designed for POS menu rendering.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectCatalogSchema.extend({
          categories: z.array(
            SelectCategorySchema.extend({
              products: z.array(
                SelectCategoryProductSchema.extend({
                  product: SelectProductSchema.extend({
                    modifierGroups: z.array(
                      SelectModifierGroupSchema.extend({
                        modifiers: z.array(
                          SelectModifierSchema.extend({
                            dependencies: z.array(SelectModifierOptionDependencySchema),
                          })
                        ),
                      })
                    ),
                  }),
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
        summary: 'Create a new catalog',
        description:
          'Creates a new menu catalog. Catalog names must be unique within the organization.',
      })
      .input(InsertCatalogSchema)
      .output(SelectCatalogSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a catalog',
        description:
          'Partially updates an existing catalog. Only provided fields will be modified.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchCatalogSchema))
      .output(SelectCatalogSchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a catalog',
        description: 'Permanently removes a catalog. This action cannot be undone.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectCatalogSchema),
  });

export default catalogContract;
