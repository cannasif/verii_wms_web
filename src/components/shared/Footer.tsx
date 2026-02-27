import { type ReactElement } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Footer(): ReactElement {
  return (
    <footer className="fixed bottom-0 right-0 z-30">
      <div className="p-4">
        <LanguageSwitcher />
      </div>
    </footer>
  );
}

