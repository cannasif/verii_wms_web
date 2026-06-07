import type { ReactElement } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ReportsPage(): ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Raporlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          WMS rapor ekranları modül bazlı olarak burada toplanacak.
        </p>
      </div>
      <Card className="rounded-3xl border-slate-200">
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700">
            <BarChart3 className="size-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Rapor merkezi hazırlanıyor</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Operasyon, stok, sevkiyat ve servis raporları ayrı feature ekranları olarak bu alana bağlanabilir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
