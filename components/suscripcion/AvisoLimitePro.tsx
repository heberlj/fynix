import Link from "next/link";

export function AvisoLimitePro({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
      <p className="text-muted">{mensaje}</p>
      <Link
        href="/configuracion?seccion=suscripcion"
        className="mt-2 inline-block font-medium text-accent hover:underline"
      >
        Ver Fynix Pro →
      </Link>
    </div>
  );
}
