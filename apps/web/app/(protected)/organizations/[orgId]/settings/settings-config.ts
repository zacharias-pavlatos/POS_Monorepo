import {
  Settings,
  User,
  Lock,
  Bell,
  CreditCard,
  type LucideIcon,
  Radio,
} from 'lucide-react';
import { GeneralSettings } from './_components/general-settings';
import { ProfileSettings } from './_components/profile-settings';
import { SecuritySettings } from './_components/security-settings';
import { BillingSettings } from './_components/billing-settings';
import { NotificationSettings } from './_components/notification-settings';
import { SessionsSettings } from './_components/session-settings';

export type SettingsCategory = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  component: React.ComponentType;
  default?: boolean;
};

export const settingsCategories: SettingsCategory[] = [
  {
    slug: 'general',
    name: 'General',
    description: 'Manage your account and preferences',
    icon: Settings,
    component: GeneralSettings,
    default: true,
  },
  {
    slug: 'profile',
    name: 'Profile',
    description: 'Update your personal information',
    icon: User,
    component: ProfileSettings,
  },
  {
    slug: 'sessions',
    name: 'Sessions',
    description: 'Manage sessions',
    icon: Radio,
    component: SessionsSettings,
  },
  {
    slug: 'security',
    name: 'Security',
    description: 'Password and authentication settings',
    icon: Lock,
    component: SecuritySettings,
  },
  {
    slug: 'notifications',
    name: 'Notifications',
    description: 'Control your notification preferences',
    icon: Bell,
    component: NotificationSettings,
  },
  {
    slug: 'billing',
    name: 'Billing',
    description: 'Manage subscriptions and payment methods',
    icon: CreditCard,
    component: BillingSettings,
  },
];
