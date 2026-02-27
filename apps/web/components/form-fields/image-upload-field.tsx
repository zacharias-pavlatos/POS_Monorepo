import * as React from 'react';
import { ImagePlus, X } from 'lucide-react';

import { Button } from '@repo/ui/components/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

export type ImageUploadFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    /** An existing image URL to display (e.g. in edit mode) */
    existingImageUrl?: string | null;
    /** Accepted file types – defaults to "image/*" */
    accept?: string;
    /** Preview height class – defaults to "h-48" */
    previewHeight?: string;
  };

export function ImageUploadField({
  field,
  fieldState,
  label = 'Image',
  description,
  disabled,
  existingImageUrl,
  accept = 'image/*',
  previewHeight = 'h-48',
}: ImageUploadFieldProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(existingImageUrl ?? null);

  // Clean up blob URLs on unmount
  React.useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    field.onChange(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleRemove() {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    field.onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel>{label}</FieldLabel>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={handleFileChange}
        aria-label={`Upload ${label.toLowerCase()}`}
      />

      {preview ? (
        <div className="border-border relative w-full overflow-hidden rounded-lg border">
          <img
            src={preview}
            alt={`${label} preview`}
            className={`${previewHeight} w-full object-cover`}
            crossOrigin="anonymous"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className={`flex ${previewHeight} border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/60 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors disabled:pointer-events-none disabled:opacity-50`}
        >
          <ImagePlus className="size-8" />
          <span className="text-sm font-medium">Upload {label}</span>
        </button>
      )}

      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
