import { type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface OpsServiceEyebrowProps {
  module: ReactNode;
}

export function OpsServiceEyebrow({ module }: OpsServiceEyebrowProps): ReactElement {
  const { t } = useTranslation('common');

  return (
    <>
      <span>{t('serviceOps.breadcrumb.parent')}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{module}</span>
    </>
  );
}
