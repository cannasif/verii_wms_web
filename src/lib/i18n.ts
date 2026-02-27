import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from '../locales/tr/common.json';
import en from '../locales/en/common.json';
import de from '../locales/de/common.json';
import fr from '../locales/fr/common.json';
import trAccessControl from '../locales/tr/access-control.json';
import enAccessControl from '../locales/en/access-control.json';
import deAccessControl from '../locales/de/access-control.json';
import frAccessControl from '../locales/fr/access-control.json';
import trUserManagement from '../locales/tr/user-management.json';
import enUserManagement from '../locales/en/user-management.json';
import deUserManagement from '../locales/de/user-management.json';
import frUserManagement from '../locales/fr/user-management.json';
import trMailSettings from '../locales/tr/mail-settings.json';
import enMailSettings from '../locales/en/mail-settings.json';
import deMailSettings from '../locales/de/mail-settings.json';
import frMailSettings from '../locales/fr/mail-settings.json';
import trHangfireMonitoring from '../locales/tr/hangfire-monitoring.json';
import enHangfireMonitoring from '../locales/en/hangfire-monitoring.json';
import deHangfireMonitoring from '../locales/de/hangfire-monitoring.json';
import frHangfireMonitoring from '../locales/fr/hangfire-monitoring.json';

const savedLanguage = localStorage.getItem('i18nextLng') || 'tr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: {
        translation: tr,
        common: tr,
        'access-control': trAccessControl,
        'user-management': trUserManagement,
        'mail-settings': trMailSettings,
        'hangfire-monitoring': trHangfireMonitoring,
      },
      en: {
        translation: en,
        common: en,
        'access-control': enAccessControl,
        'user-management': enUserManagement,
        'mail-settings': enMailSettings,
        'hangfire-monitoring': enHangfireMonitoring,
      },
      de: {
        translation: de,
        common: de,
        'access-control': deAccessControl,
        'user-management': deUserManagement,
        'mail-settings': deMailSettings,
        'hangfire-monitoring': deHangfireMonitoring,
      },
      fr: {
        translation: fr,
        common: fr,
        'access-control': frAccessControl,
        'user-management': frUserManagement,
        'mail-settings': frMailSettings,
        'hangfire-monitoring': frHangfireMonitoring,
      },
    },
    ns: ['translation', 'common', 'access-control', 'user-management', 'mail-settings', 'hangfire-monitoring'],
    defaultNS: 'translation',
    lng: savedLanguage,
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
