/**
 * Dynamic settings page route, using catch-all [slug] pattern.
 *
 * Handles all settings sub-routes (/settings/general, /settings/profile, etc.)
 * from a single file. Renders the component associated with each category
 * as defined in settings-config.ts.
 *
 * To add a new settings page:
 * 1. Create the component in _components/
 * 2. Add it to settings-config.ts
 *
 * Routes are pre-rendered at build time via generateStaticParams.
 */

import { notFound } from 'next/navigation';
import { settingsCategories } from '../settings-config';

// Generate static params for all categories
export function generateStaticParams() {
  return settingsCategories.map(category => ({
    slug: category.slug,
  }));
}

export default async function SettingsCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = settingsCategories.find(c => c.slug === slug);

  // Returns 404 if the slug doesn't match any category.
  if (!category) notFound();

  const Component = category.component;
  return <Component />;
}
