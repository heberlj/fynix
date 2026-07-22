import { formatearMoneda } from "@/lib/quincenas";
import type { ContextoIaFynix } from "@/lib/ia-fynix-contexto";

export interface SugerenciaIaFynix {
  id: string;
  titulo: string;
  contenido: string;
}

function fmt(monto: number, moneda: string) {
  return formatearMoneda(monto, moneda);
}

function sugerenciaQuePagarPrimero(ctx: ContextoIaFynix): SugerenciaIaFynix {
  const pendientes = ctx.proximosPagos.filter((p) => p.monto > 0);

  if (pendientes.length === 0) {
    const sinCompromisos =
      ctx.prestamosActivos.length === 0 &&
      ctx.cuotasPopularActivas.length === 0 &&
      ctx.gastosFijosQuincenaActual.every((g) => g.pagado) &&
      ctx.tarjetas.length === 0;

    if (sinCompromisos) {
      return {
        id: "que-pagar-primero",
        titulo: "Qué pagar primero",
        contenido: `En ${ctx.quincenaActual.etiqueta} no tienes compromisos pendientes registrados. Si tienes pagos fuera de la app, agrégalos en Gastos fijos, Préstamos o Tarjetas.`,
      };
    }

    return {
      id: "que-pagar-primero",
      titulo: "Qué pagar primero",
      contenido: `En ${ctx.quincenaActual.etiqueta} ya cubriste los compromisos que Fynix conoce. Revisa Tarjetas por si hay deuda sin actualizar.`,
    };
  }

  const ordenados = [...pendientes].sort(
    (a, b) => a.diasHastaVencimiento - b.diasHastaVencimiento
  );
  const prioridad = ordenados[0];

  const lista = ordenados
    .slice(0, 6)
    .map((p, i) => {
      const cuando =
        p.esHoy
          ? "hoy"
          : p.diasHastaVencimiento === 1
            ? "mañana"
            : `en ${p.diasHastaVencimiento} días`;
      const urg = p.urgente ? " ⚠" : "";
      return `${i + 1}. **${p.nombre}** (${p.tipo}): ${fmt(p.monto, p.moneda)} · ${cuando}${urg}`;
    })
    .join("\n");

  const totalQuincena = ordenados
    .filter((p) => p.moneda === ctx.monedaReferencia)
    .reduce((s, p) => s + p.monto, 0);

  let consejo = `Prioriza **${prioridad.nombre}** (${fmt(prioridad.monto, prioridad.moneda)}`;
  if (prioridad.esHoy) {
    consejo += ", vence hoy";
  } else if (prioridad.diasHastaVencimiento <= 3) {
    consejo += `, vence en ${prioridad.diasHastaVencimiento} día${prioridad.diasHastaVencimiento !== 1 ? "s" : ""}`;
  } else if (prioridad.urgente) {
    consejo += ", marcado como urgente";
  }
  consejo += ").";

  if (totalQuincena > 0) {
    consejo += `\n\nCompromisos próximos en ${ctx.monedaReferencia}: ~${fmt(totalQuincena, ctx.monedaReferencia)}.`;
    if (ctx.liquidezDisponible > 0) {
      if (ctx.liquidezDisponible >= totalQuincena) {
        consejo += ` Tu liquidez (${fmt(ctx.liquidezDisponible, ctx.monedaReferencia)}) alcanza para cubrirlos.`;
      } else {
        const faltante = totalQuincena - ctx.liquidezDisponible;
        consejo += ` Te faltarían ~${fmt(faltante, ctx.monedaReferencia)} de liquidez si pagas todo.`;
      }
    }
  }

  const gastosPendientes = ctx.gastosFijosQuincenaActual.filter(
    (g) => g.montoPendiente > 0
  );
  if (gastosPendientes.length > 0) {
    const nombres = gastosPendientes
      .slice(0, 3)
      .map((g) => g.nombre)
      .join(", ");
    consejo += `\n\nGastos fijos pendientes en la quincena: ${nombres}${gastosPendientes.length > 3 ? "…" : ""}.`;
  }

  return {
    id: "que-pagar-primero",
    titulo: "Qué pagar primero",
    contenido: `${consejo}\n\nOrden sugerido:\n${lista}`,
  };
}

function sugerenciaGastosAltos(ctx: ContextoIaFynix): SugerenciaIaFynix | null {
  const top = ctx.gastosPorCategoria.slice(0, 3);
  if (top.length === 0) {
    return {
      id: "gastos-altos",
      titulo: "Dónde gastas más",
      contenido: `No registraste gastos en ${ctx.periodoEtiqueta}. Cuando agregues transacciones, aquí verás en qué categorías concentras el gasto.`,
    };
  }

  const lista = top
    .map(
      (g, i) =>
        `${i + 1}. **${g.categoria}**: ${fmt(g.monto, ctx.monedaReferencia)} (${g.porcentaje.toFixed(0)}%)`
    )
    .join("\n");

  const mayor = top[0];
  const consejo =
    mayor.porcentaje >= 40
      ? `**${mayor.categoria}** concentra casi la mitad de tus gastos. Revisa si hay suscripciones o compras repetitivas que puedas recortar.`
      : `Tus gastos están repartidos. Aun así, vigila **${mayor.categoria}** porque es tu mayor rubro del mes.`;

  return {
    id: "gastos-altos",
    titulo: "Dónde gastas más",
    contenido: `En ${ctx.periodoEtiqueta} gastaste ${fmt(ctx.gastosMes, ctx.monedaReferencia)}:\n\n${lista}\n\n${consejo}`,
  };
}

function sugerenciaTarjetaPagar(ctx: ContextoIaFynix): SugerenciaIaFynix {
  if (ctx.tarjetas.length === 0) {
    return {
      id: "tarjeta-pagar",
      titulo: "Qué tarjeta pagar primero",
      contenido:
        "No tienes deuda registrada en tarjetas. Si pagaste fuera de la app, actualiza el saldo en Tarjetas para recibir mejores sugerencias.",
    };
  }

  const ordenadas = [...ctx.tarjetas].sort((a, b) => {
    const scoreA = a.utilizacion * 2 + (30 - Math.min(a.diasHastaPago, 30));
    const scoreB = b.utilizacion * 2 + (30 - Math.min(b.diasHastaPago, 30));
    return scoreB - scoreA;
  });
  const prioritaria = ordenadas[0];

  const razones: string[] = [];
  if (prioritaria.utilizacion >= 70) {
    razones.push(`usa el ${prioritaria.utilizacion.toFixed(0)}% de su límite`);
  }
  if (prioritaria.diasHastaPago <= 7) {
    razones.push(`su pago vence en ${prioritaria.diasHastaPago} día${prioritaria.diasHastaPago !== 1 ? "s" : ""}`);
  }
  if (prioritaria.deuda === Math.max(...ctx.tarjetas.map((t) => t.deuda))) {
    razones.push(`tiene la deuda más alta (${fmt(prioritaria.deuda, prioritaria.moneda)})`);
  }

  const porque =
    razones.length > 0
      ? ` porque ${razones.join(" y ")}`
      : ` con deuda de ${fmt(prioritaria.deuda, prioritaria.moneda)}`;

  let detalle = `Prioriza **${prioritaria.nombre}** (${prioritaria.banco})${porque}.`;
  if (ordenadas.length > 1) {
    const segunda = ordenadas[1];
    detalle += `\n\nDespués considera **${segunda.nombre}**: ${fmt(segunda.deuda, segunda.moneda)} de deuda, pago en ${segunda.diasHastaPago} días.`;
  }

  return {
    id: "tarjeta-pagar",
    titulo: "Qué tarjeta pagar primero",
    contenido: detalle,
  };
}

function sugerenciaDineroSobrante(ctx: ContextoIaFynix): SugerenciaIaFynix {
  const cuentasConSaldo = ctx.cuentas
    .filter((c) => c.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo);

  const cuentaPrincipal = cuentasConSaldo[0];
  const totalLiquido =
    ctx.efectivo +
    cuentasConSaldo.reduce((s, c) => s + c.saldo, 0);

  if (!cuentaPrincipal && ctx.efectivo <= 0) {
    return {
      id: "dinero-sobrante",
      titulo: "Qué hacer con dinero disponible",
      contenido:
        "No hay saldo positivo en cuentas ni efectivo registrado. Cuando tengas disponible, te sugeriré si conviene pagar deuda, ahorrar o dejar un colchón.",
    };
  }

  const reservaSugerida = Math.max(
    ctx.gastosMes * 0.5,
    ctx.gastosMes > 0 ? ctx.gastosMes : 5000
  );
  const excedente = Math.max(0, totalLiquido - reservaSugerida);

  const ideas: string[] = [];

  if (excedente > 0) {
    ideas.push(
      `Tienes unos ${fmt(excedente, ctx.monedaReferencia)} por encima de un colchón básico (${fmt(reservaSugerida, ctx.monedaReferencia)} ≈ medio mes de gastos).`
    );
  } else {
    ideas.push(
      `Tu liquidez (${fmt(totalLiquido, ctx.monedaReferencia)}) está cerca del colchón recomendado. No parece haber excedente para mover ahora.`
    );
  }

  if (ctx.tarjetas.length > 0 && excedente > 0) {
    const t = ctx.tarjetas[0];
    ideas.push(
      `Con excedente, pagar **${t.nombre}** (${fmt(t.deuda, t.moneda)}) reduce intereses y libera límite.`
    );
  }

  if (ctx.metasAhorro.length > 0 && excedente > 0) {
    const meta = ctx.metasAhorro[0];
    const aporte = Math.min(excedente, meta.faltante);
    ideas.push(
      `O aporta ${fmt(aporte, meta.moneda)} a tu meta **${meta.nombre}** (${meta.progreso.toFixed(0)}% completada).`
    );
  }

  if (cuentaPrincipal) {
    ideas.unshift(
      `La cuenta con más saldo es **${cuentaPrincipal.nombre}** (${cuentaPrincipal.banco}): ${fmt(cuentaPrincipal.saldo, cuentaPrincipal.moneda)}.`
    );
  }

  return {
    id: "dinero-sobrante",
    titulo: "Qué hacer con dinero disponible",
    contenido: ideas.join("\n\n"),
  };
}

function sugerenciaAhorro(ctx: ContextoIaFynix): SugerenciaIaFynix {
  const ideas: string[] = [];

  if (ctx.balanceMes < 0) {
    ideas.push(
      `Este mes gastas más de lo que ingresas (${fmt(Math.abs(ctx.balanceMes), ctx.monedaReferencia)} en rojo). Antes de ahorrar más, intenta recortar la categoría top o posponer gastos flexibles.`
    );
  } else if (ctx.balanceMes > 0) {
    ideas.push(
      `Vas positivo en ${ctx.periodoEtiqueta}: sobran ${fmt(ctx.balanceMes, ctx.monedaReferencia)}. Automatiza ese monto hacia ahorro o pago de deuda al recibir ingresos.`
    );
  }

  const mayorGasto = ctx.gastosPorCategoria[0];
  if (mayorGasto && mayorGasto.porcentaje >= 25) {
    const metaRecorte = mayorGasto.monto * 0.1;
    ideas.push(
      `Recortar solo un 10% en **${mayorGasto.categoria}** liberaría ~${fmt(metaRecorte, ctx.monedaReferencia)} al mes.`
    );
  }

  if (ctx.metasAhorro.length > 0) {
    const meta = ctx.metasAhorro[0];
    ideas.push(
      `Tu meta **${meta.nombre}** necesita ${fmt(meta.faltante, meta.moneda)}. Aportes pequeños y constantes (${fmt(Math.max(meta.faltante / 6, 500), meta.moneda)}/mes) ayudan a llegar sin presión.`
    );
  } else {
    ideas.push(
      "Crea una meta de ahorro en **Metas de ahorro** para que Fynix te recuerde un objetivo concreto."
    );
  }

  return {
    id: "ahorro",
    titulo: "Ideas para ahorrar",
    contenido: ideas.join("\n\n"),
  };
}

export function generarSugerenciasIaFynix(
  ctx: ContextoIaFynix
): SugerenciaIaFynix[] {
  const sugerencias = [
    sugerenciaQuePagarPrimero(ctx),
    sugerenciaAhorro(ctx),
    sugerenciaTarjetaPagar(ctx),
    sugerenciaDineroSobrante(ctx),
    sugerenciaGastosAltos(ctx),
  ];
  return sugerencias.filter((s): s is SugerenciaIaFynix => s != null);
}

function coincideConsulta(consulta: string, palabras: string[]) {
  const q = consulta.toLowerCase();
  return palabras.some((p) => q.includes(p));
}

export function responderConsultaIaFynix(
  ctx: ContextoIaFynix,
  consulta: string
): { respuesta: string; sugerencias: SugerenciaIaFynix[] } {
  const limpia = consulta.trim();
  const todas = generarSugerenciasIaFynix(ctx);

  if (!limpia) {
    return {
      respuesta:
        "Según tus registros de este mes, estas son mis sugerencias principales:",
      sugerencias: todas,
    };
  }

  const q = limpia.toLowerCase();
  const ids: string[] = [];

  if (
    coincideConsulta(q, [
      "primero",
      "prioridad",
      "prestamo",
      "préstamo",
      "cuota",
      "popular",
      "fijo",
      "quincena",
      "venc",
      "compromiso",
      "pendiente",
    ])
  ) {
    ids.push("que-pagar-primero");
  }
  if (
    coincideConsulta(q, [
      "ahorr",
      "guardar",
      "meta",
      "sobra",
      "ahorro",
    ])
  ) {
    ids.push("ahorro");
  }
  if (
    coincideConsulta(q, [
      "tarjeta",
      "pagar",
      "deuda",
      "crédito",
      "credito",
      "visa",
      "mastercard",
    ])
  ) {
    ids.push("tarjeta-pagar");
  }
  if (
    coincideConsulta(q, [
      "cuenta",
      "dinero",
      "saldo",
      "disponible",
      "liquidez",
      "sobra",
      "excedente",
    ])
  ) {
    ids.push("dinero-sobrante");
  }
  if (
    coincideConsulta(q, [
      "gast",
      "gasto",
      "categor",
      "mucho",
      "dónde",
      "donde",
      "compro",
    ])
  ) {
    ids.push("gastos-altos");
  }

  const elegidas =
    ids.length > 0
      ? todas.filter((s) => ids.includes(s.id))
      : todas;

  const respuesta =
    ids.length > 0
      ? `Sobre tu consulta, esto es lo más relevante según tus datos de ${ctx.periodoEtiqueta}:`
      : `No identifiqué un tema exacto, pero según ${ctx.periodoEtiqueta} esto es lo que más te conviene revisar:`;

  return { respuesta, sugerencias: elegidas };
}

export function respuestaLocalComoChat(
  ctx: ContextoIaFynix,
  consulta: string
): string {
  const { respuesta, sugerencias } = responderConsultaIaFynix(ctx, consulta);
  const bloques = sugerencias.map(
    (s) => `### ${s.titulo}\n${s.contenido.replace(/\*\*/g, "")}`
  );
  return [respuesta, ...bloques].join("\n\n");
}
