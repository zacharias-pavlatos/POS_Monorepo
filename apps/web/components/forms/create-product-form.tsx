'use client';

import { rpcClient, rpcTanstackQuery } from '@/lib/rpc-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@repo/ui/components/field';
import { Input } from '@repo/ui/components/input';
import { Switch } from '@repo/ui/components/switch';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/components/sonner';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';

const createProductFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  price: z.string().min(0, 'Price must be positive'),
  isActive: z.boolean().default(true),
});

type CreateProductFormType = z.infer<typeof createProductFormSchema>;

export function CreateProductForm() {

const form = useForm<CreateProductFormType>({
  resolver: zodResolver(createProductFormSchema) as Resolver<CreateProductFormType>,
  defaultValues: {
    name: '',
    description: '',
    price: '0',
    isActive: true,
  },
});

  const { isSubmitting } = form.formState;

  function onSubmit(data: CreateProductFormType) {
    rpcClient.products.create({
      name: data.name,
      description: data.description,
      basePrice:  Math.round(Number(data.price) * 100), // <-- Convert to cents
      isActive: data.isActive,
    });
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                {...field}
                id="name"
                placeholder="Product Name"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                {...field}
                id="description"
                placeholder="Product Description"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Optional description for the product.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="price"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="price">Price ($)</FieldLabel>
              <Input
                {...field}
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="isActive"
          control={form.control}
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FieldLabel htmlFor="isActive">Active Status</FieldLabel>
                <FieldDescription>
                  Product will be visible in the POS when active.
                </FieldDescription>
              </div>
              <Switch
                {...field}
                id="isActive"
                checked={value}
                onCheckedChange={onChange}
                disabled={isSubmitting}
              />
            </div>
          )}
        />
      </FieldGroup>

      <Button disabled={isSubmitting} type="submit" className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Product'}
      </Button>
    </form>
  );
}
