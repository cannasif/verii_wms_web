import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WelcomePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg border-2 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            {t('welcome.title')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('welcome.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild size="lg" className="shadow-md">
            <Link to="/dashboard">
              {t('welcome.goToDashboard')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
