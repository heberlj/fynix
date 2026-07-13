"use client";

import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";

const BENEFICIOS_GRATIS = [
  "Cuentas, tarjetas y transacciones ilimitadas",
  "Gastos fijos y presupuesto por quincena",
  "Respaldo manual en JSON",
  "Sincronización en la nube con tu cuenta",
];

const BENEFICIOS_PRO = [
  "Todo lo del plan Gratis",
  "Exportación avanzada y reportes",
  "Soporte prioritario",
  "Funciones nuevas antes que nadie",
];

export function ConfiguracionSuscripcion() {
  return (
    <PanelConfiguracion
      titulo="Suscripción"
      descripcion="Tu plan actual y opciones para el futuro"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                Plan actual
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">Gratis</p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
              Activo
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Tienes acceso completo a las funciones principales de Fynix sin
            costo.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Incluido hoy</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {BENEFICIOS_GRATIS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-ingreso">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-background p-4 opacity-90">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Fynix Pro</h3>
              <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-medium uppercase text-muted">
                Próximamente
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {BENEFICIOS_PRO.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-muted">○</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted"
            >
              Disponible pronto
            </button>
          </div>
        </div>
      </div>
    </PanelConfiguracion>
  );
}
