/**
 * /modifiers
 *
 * Individual modifier options within a modifier group.
 * Each modifier has a base price and can have dependencies that override
 * its price or availability based on other modifier selections.
 *
 * Example: "Large" modifier in a "Size" group with basePrice 350 (€3.50).
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertModifierSchema,
  PatchModifierSchema,
  SelectModifierSchema,
  SelectModifierOptionDependencySchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const modifierContract = oc
  .prefix('/modifiers')
  .tag('modifier')
  .router({
    byGroup: oc
      .route({
        method: 'GET',
        path: '/by-group/{modifierGroupId}',
        summary: 'List modifiers for a group',
        description:
          'Retrieve all modifiers belonging to a specific group, ordered by display order.',
      })
      .input(z.object({ modifierGroupId: z.uuid() }))
      .output(z.array(SelectModifierSchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a modifier',
        description: 'Returns a single modifier by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectModifierSchema),

    oneWithDependencies: oc
      .route({
        method: 'GET',
        path: '/{id}/dependencies',
        summary: 'Retrieve a modifier with its dependencies',
        description:
          'Returns a modifier with all its dependency rules (price overrides and availability conditions).',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectModifierSchema.extend({
          dependencies: z.array(SelectModifierOptionDependencySchema),
          dependents: z.array(SelectModifierOptionDependencySchema),
        })
      ),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new modifier',
        description:
          'Creates a new modifier option within a group. Requires a modifierGroupId in the request body.',
      })
      .input(InsertModifierSchema)
      .output(SelectModifierSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a modifier',
        description:
          'Partially updates an existing modifier. Only provided fields will be modified.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchModifierSchema))
      .output(SelectModifierSchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a modifier',
        description: 'Permanently removes a modifier and all its dependencies (cascade).',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectModifierSchema),
  });

export default modifierContract;
