"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFinanzas } from "@/context/FinanzasContext";
import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import { validarDiasPago } from "@/lib/validar-configuracion";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

export function ConfiguracionPerfil() {
  const router = useRouter();
  const { sesion, cerrarSesion, actualizarPerfil } = useAuth();
  const { configuracion, actualizarConfiguracion } = useFinanzas();

  const [nombre, setNombre] = useState(sesion?.nombre ?? "");
  const [dia1, setDia1] = useState(String(configuracion.diasPago[0]));
  const [dia2, setDia2] = useState(String(configuracion.diasPago[1]));
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  const inicial = (sesion?.nombre ?? "?").charAt(0).toUpperCase();

  useEffect(() => {
    if (sesion?.nombre) setNombre(sesion.nombre);
  }, [sesion?.nombre]);

  useEffect(() => {
    setDia1(String(configuracion.diasPago[0]));
    setDia2(String(configuracion.diasPago[1]));
    setMoneda(configuracion.moneda);
  }, [configuracion.diasPago, configuracion.moneda]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const d1 = Number(dia1);
    const d2 = Number(dia2);
    const errorDias = validarDiasPago(d1, d2);
    if (errorDias) {
      setError(errorDias);
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    if (sesion && nombre.trim() !== sesion.nombre) {
      const resultado = await actualizarPerfil(nombre.trim());
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
    }

    actualizarConfiguracion({
      diasPago: [d1, d2],
      moneda,
    });

    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  function handleCerrarSesion() {
    cerrarSesion();
    router.push("/login");
  }

  return (
    <PanelConfiguracion
      titulo="Perfil"
      descripcion="Tu cuenta y preferencias financieras básicas"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xl font-semibold text-accent">
            {inicial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {sesion?.nombre ?? "Usuario"}
            </p>
            <p className="truncate text-xs text-muted">{sesion?.email}</p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Correo</span>
          <input
            type="email"
            value={sesion?.email ?? ""}
            readOnly
            className={`${inputClass} cursor-not-allowed opacity-70`}
          />
          <span className="text-xs text-muted">
            El correo no se puede cambiar desde la app
          </span>
        </label>

        <div className="border-t border-border pt-5">
          <h3 className="text-sm font-semibold text-foreground">Finanzas</h3>
          <p className="mt-1 text-xs text-muted">
            Días en que recibes tu salario y moneda principal de la app
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Primer pago (día)
              </span>
              <input
                type="number"
                min={1}
                max={31}
                value={dia1}
                onChange={(e) => setDia1(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Segundo pago (día)
              </span>
              <input
                type="number"
                min={1}
                max={31}
                value={dia2}
                onChange={(e) => setDia2(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Moneda principal
            </span>
            <SelectorMoneda value={moneda} onChange={setMoneda} />
          </label>

          <div className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-xs text-muted">
            <p className="font-medium text-foreground">Quincenas (calendario)</p>
            <p className="mt-1">Q1: del 1 al 15 · Q2: del 16 al fin de mes</p>
            <p className="mt-2">
              Tus días de pago ({dia1} y {dia2}) se usan para referencia de
              ingresos y diezmos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {guardado ? "¡Guardado!" : "Guardar perfil"}
          </button>
          <button
            type="button"
            onClick={handleCerrarSesion}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </div>

        {error && <p className="text-sm text-gasto">{error}</p>}
      </form>
    </PanelConfiguracion>
  );
}
