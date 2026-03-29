import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function RouteErrorPage() {
  const error = useRouteError();

  let title = 'Beklenmeyen bir hata oluştu';
  let description = 'Uygulama yeni sürüme geçmiş olabilir. Sayfayı yenileyip tekrar deneyin.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description = typeof error.data === 'string' && error.data.trim().length > 0
      ? error.data
      : description;
  } else if (error instanceof Error && error.message.trim().length > 0) {
    description = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Sayfayi yenile
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
            onClick={() => window.location.assign('/')}
          >
            Anasayfa
          </button>
        </div>
      </div>
    </div>
  );
}
