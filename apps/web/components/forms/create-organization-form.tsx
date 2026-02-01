'use client';

import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@repo/ui/components/field';
import { Input } from '@repo/ui/components/input';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters'),
});

type CreateOrganizationFormType = z.infer<typeof createOrganizationSchema>;

export function CreateOrganizationForm() {
  const form = useForm({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });
  const { isSubmitting } = form.formState;

  async function handleCreateOrganization(data: CreateOrganizationFormType) {
    const slug = data.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const res = await authClient.organization.create({
      name: data.name,
      slug,
    });

    if (res.error) {
      console.error(res.error.message);
      // toast.error(res.error.message || "Failed to create organization");
    } else {
      form.reset();
      //  await authClient.organization.setActive({ organizationId: res.data.id });
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(handleCreateOrganization)}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="org-name">Organization Name</FieldLabel>
              <Input
                {...field}
                id="org-name"
                placeholder="My Organization"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                This is your organization's public name.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
              <Input
                {...field}
                id="org-slug"
                placeholder="my-org"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                URL-friendly identifier for your organization.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button disabled={isSubmitting} type="submit" className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Organization'}
      </Button>
    </form>
  );
}
