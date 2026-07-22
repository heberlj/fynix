"use client";

import { useState } from "react";
import {
  CAPTURAS_LANDING,
  type IdCapturaLanding,
} from "@/lib/landing-contenido";

function MarcoTelefono({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-[2rem] border border-white/15 bg-[#0f1419] p-2 shadow-2xl shadow-black/50">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#f8fafc]">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 text-[10px] text-slate-500">
            <span>9:41</span>
            <span className="font-medium text-slate-700">Fynix</span>
            <span>100%</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function MockHome() {
  return (
    <div className="space-y-3 bg-slate-50 p-3 text-left">
      <div>
        <p className="text-sm font-semibold text-slate-900">Home</p>
        <p className="text-[10px] text-slate-500">Quincena actual: Q1 · 1–15 jul</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-[9px] text-slate-500">Cuenta principal</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">RD$ 42,350</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-[9px] text-slate-500">Tarjeta Visa</p>
          <p className="mt-0.5 text-sm font-bold text-rose-600">-US$ 280</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <p className="text-[9px] font-medium text-slate-600">Gastos Q1</p>
        <div className="mt-2 flex h-16 items-end gap-1">
          {[40, 65, 45, 80, 55, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-blue-500/80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
        <p className="text-[9px] font-medium text-amber-800">Próximos pagos</p>
        <p className="mt-1 text-[10px] text-amber-900">Alquiler · RD$ 12,000 · en 2 días</p>
        <p className="text-[10px] text-amber-900">Internet · RD$ 1,899 · en 4 días</p>
      </div>
    </div>
  );
}

function MockGastosFijos() {
  return (
    <div className="space-y-3 bg-slate-50 p-3 text-left">
      <div>
        <p className="text-sm font-semibold text-slate-900">Gastos fijos</p>
        <p className="text-[10px] text-slate-500">Julio 2026</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-2">
          <p className="text-[9px] font-semibold text-blue-800">Quincena 1</p>
          <ul className="mt-2 space-y-1.5 text-[10px] text-slate-700">
            <li className="flex justify-between rounded bg-white px-1.5 py-1">
              <span>Alquiler</span>
              <span className="font-medium">RD$12k</span>
            </li>
            <li className="flex justify-between rounded bg-white px-1.5 py-1">
              <span>Netflix</span>
              <span className="font-medium">RD$499</span>
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2">
          <p className="text-[9px] font-semibold text-slate-600">Quincena 2</p>
          <ul className="mt-2 space-y-1.5 text-[10px] text-slate-700">
            <li className="flex justify-between rounded bg-slate-50 px-1.5 py-1">
              <span>Préstamo</span>
              <span className="font-medium">RD$8.5k</span>
            </li>
            <li className="flex justify-between rounded bg-slate-50 px-1.5 py-1">
              <span>Diezmo</span>
              <span className="font-medium">RD$2.5k</span>
            </li>
          </ul>
        </div>
      </div>
      <button
        type="button"
        className="w-full rounded-lg bg-blue-600 py-2 text-[10px] font-medium text-white"
        tabIndex={-1}
      >
        Marcar pagados de esta quincena (2)
      </button>
    </div>
  );
}

function MockIa() {
  return (
    <div className="space-y-3 bg-slate-50 p-3 text-left">
      <div>
        <p className="text-sm font-semibold text-slate-900">IA de Fynix</p>
        <p className="text-[10px] text-slate-500">Créditos: 18 / 20</p>
      </div>
      <div className="space-y-2">
        <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-600 px-3 py-2 text-[10px] text-white">
          ¿Qué pago primero esta quincena?
        </div>
        <div className="max-w-[90%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[10px] leading-relaxed text-slate-700">
          Prioriza <strong>Alquiler</strong> (vence en 2 días) y luego la cuota de{" "}
          <strong>Visa</strong>. Te quedan RD$ 6,580 disponibles en Q1.
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {["¿Qué pago primero?", "¿Cómo ahorrar más?"].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] text-slate-600"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

const MOCKS: Record<IdCapturaLanding, () => React.ReactNode> = {
  home: MockHome,
  "gastos-fijos": MockGastosFijos,
  ia: MockIa,
};

export function LandingCapturas() {
  const [activa, setActiva] = useState<IdCapturaLanding>("home");
  const captura = CAPTURAS_LANDING.find((c) => c.id === activa)!;

  return (
    <section
      id="capturas"
      className="border-t border-white/5 px-4 py-20 sm:px-6 scroll-mt-20"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Vista previa
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
          Así se ve Fynix por dentro
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
          Interfaz real de la app: resumen en Home, gastos por quincena y asistente
          con IA. Sin adornos de marketing — esto es lo que usas al iniciar sesión.
        </p>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="flex flex-wrap gap-2 lg:w-56 lg:flex-col">
            {CAPTURAS_LANDING.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiva(item.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  activa === item.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/8 bg-[#111827]/40 hover:border-white/15"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    activa === item.id ? "text-white" : "text-slate-300"
                  }`}
                >
                  {item.titulo}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.descripcion}</p>
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-4 text-center text-xs text-slate-500 lg:text-left">
              {captura.titulo} — {captura.descripcion}
            </p>
            <MarcoTelefono>{MOCKS[activa]()}</MarcoTelefono>
          </div>
        </div>
      </div>
    </section>
  );
}
