import { settingsCategories } from './settings-config';
import { SettingsNavMobile } from './_components/settings-nav-mobile';

export default function SettingsPage() {
  const defaultCategory = settingsCategories.find(c => c.default);
  const DefaultComponent = defaultCategory?.component;

  return (
    <>
      {/* Desktop: render default category component */}
      <div className="hidden md:block">{DefaultComponent && <DefaultComponent />}</div>

      {/* Mobile: show category cards */}
      <div className="-m-6 md:hidden">
        <SettingsNavMobile />
      </div>
    </>
  );
}
