/**
 * /modifier-groups
 *
 * Groups of related modifier options attached to a product.
 * Each group has selection rules (min/max) and contains modifiers.
 *
 * Example: A "Size" group (min=1, max=1, required) with Small/Medium/Large options.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertModifierGroupSchema,
  PatchModifierGroupSchema,
  SelectModifierGroupSchema,
  SelectModifierSchema,
  SelectModifierOptionDependencySchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const modifierGroupContract = oc
  .prefix('/modifier-groups')
  .tag('modifier-group')
  .router({
    all: oc
      .route({
        method: 'GET',
        path: '/',
        summary: 'List all modifier groups',
        description: 'Retrieve all modifier groups for the organization.',
      })
      .output(z.array(SelectModifierGroupSchema)),

    byProduct: oc
      .route({
        method: 'GET',
        path: '/by-product/{productId}',
        summary: 'List modifier groups for a product',
        description:
          'Retrieve all modifier groups belonging to a specific product, ordered by display order.',
      })
      .input(z.object({ productId: z.uuid() }))
      .output(z.array(SelectModifierGroupSchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a modifier group',
        description: 'Returns a single modifier group by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectModifierGroupSchema),

    oneWithModifiers: oc
      .route({
        method: 'GET',
        path: '/{id}/modifiers',
        summary: 'Retrieve a modifier group with its modifiers and dependencies',
        description:
          'Returns a modifier group with all its modifier options and their dependency rules populated.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectModifierGroupSchema.extend({
          modifiers: z.array(
            SelectModifierSchema.extend({
              dependencies: z.array(SelectModifierOptionDependencySchema),
            })
          ),
        })
      ),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new modifier group',
        description:
          'Creates a new modifier group for a product. Requires a productId in the request body.',
      })
      .input(InsertModifierGroupSchema)
      .output(SelectModifierGroupSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a modifier group',
        description:
          'Partially updates an existing modifier group. Only provided fields will be modified.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchModifierGroupSchema))
      .output(SelectModifierGroupSchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a modifier group',
        description:
          'Permanently removes a modifier group and all its modifiers and dependencies (cascade).',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectModifierGroupSchema),
  });

export default modifierGroupContract;
