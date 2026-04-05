import { type ReactElement, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageActionBar } from './PageActionBar';
import { PageState } from './PageState';

interface DetailPageShellProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingTitle?: string;
  loadingDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function DetailPageShell({
  title,
  description,
  actions,
  children,
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingTitle,
  loadingDescription,
  errorTitle,
  errorDescription,
  emptyTitle,
  emptyDescription,
  actionLabel,
  onAction,
  className,
}: DetailPageShellProps): ReactElement {
  let content = children;

  if (isLoading) {
    content = (
      <PageState
        tone="loading"
        title={loadingTitle ?? 'Loading'}
        description={loadingDescription}
        compact
      />
    );
  } else if (isError) {
    content = (
      <PageState
        tone="error"
        title={errorTitle ?? 'Something went wrong'}
        description={errorDescription}
        actionLabel={actionLabel}
        onAction={onAction}
        compact
      />
    );
  } else if (isEmpty) {
    content = (
      <PageState
        tone="empty"
        title={emptyTitle ?? 'No data'}
        description={emptyDescription}
        actionLabel={actionLabel}
        onAction={onAction}
        compact
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <PageActionBar title={title} description={description} actions={actions} />
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
