import type { ControllerFieldState } from 'react-hook-form';

/** Props passed from Controller's render function to any field component. */
export type FieldRenderProps = {
  field: {
    name: string;
    value: any;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    ref: React.RefCallback<any>;
    disabled?: boolean;
  };
  fieldState: ControllerFieldState;
};

/** Common UI props shared by most field components. */
export type BaseFieldUIProps = {
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
};
