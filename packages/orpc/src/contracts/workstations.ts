/**
 * /workstations
 *
 * Kitchen/bar preparation stations for order routing.
 * Categories and products are assigned to workstations to direct
 * orders to the correct preparation area.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  InsertWorkStationSchema,
  PatchWorkStationSchema,
  SelectWorkStationSchema,
  SelectCategorySchema,
  SelectProductSchema,
} from '@repo/db/schema';

import { missingIdError } from '../utils/commonErrors';

const workstationContract = oc
  .prefix('/workstations')
  .tag('workstation')
  .router({
    all: oc
      .route({
        method: 'GET',
        path: '/',
        summary: 'List all workstations',
        description: 'Retrieve all workstations for the organization.',
      })
      .output(z.array(SelectWorkStationSchema)),

    one: oc
      .route({
        method: 'GET',
        path: '/{id}',
        summary: 'Retrieve a workstation',
        description: 'Returns a single workstation by its unique identifier.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectWorkStationSchema),

    oneWithCategories: oc
      .route({
        method: 'GET',
        path: '/{id}/categories',
        summary: 'Retrieve a workstation with its assigned categories',
        description: 'Returns a workstation with all categories routed to this station.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectWorkStationSchema.extend({
          categories: z.array(SelectCategorySchema),
        })
      ),

    oneDetailed: oc
      .route({
        method: 'GET',
        path: '/{id}/detailed',
        summary: 'Retrieve a workstation with categories and products',
        description:
          'Returns a workstation with all assigned categories and products. Useful for kitchen display setup.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(
        SelectWorkStationSchema.extend({
          categories: z.array(SelectCategorySchema),
          products: z.array(SelectProductSchema),
        })
      ),

    create: oc
      .route({
        method: 'POST',
        path: '/',
        summary: 'Create a new workstation',
        description:
          'Creates a new preparation station. Workstation names must be unique within the organization.',
      })
      .input(InsertWorkStationSchema)
      .output(SelectWorkStationSchema),

    update: oc
      .route({
        method: 'PATCH',
        path: '/{id}',
        summary: 'Update a workstation',
        description:
          'Partially updates an existing workstation. Only provided fields will be modified.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }).and(PatchWorkStationSchema))
      .output(SelectWorkStationSchema),

    delete: oc
      .route({
        method: 'DELETE',
        path: '/{id}',
        summary: 'Delete a workstation',
        description:
          'Permanently removes a workstation. Categories and products assigned to this station will need reassignment.',
      })
      .errors(missingIdError)
      .input(z.object({ id: z.uuid() }))
      .output(SelectWorkStationSchema),
  });

export default workstationContract;
