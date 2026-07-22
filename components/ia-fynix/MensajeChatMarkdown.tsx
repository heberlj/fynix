import type { ReactNode } from "react";

function FormatoInline({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((parte, i) =>
        parte.startsWith("**") && parte.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {parte.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{parte}</span>
        )
      )}
    </>
  );
}

export function MensajeChatMarkdown({ contenido }: { contenido: string }) {
  const lineas = contenido.split("\n");
  const bloques: ReactNode[] = [];
  let itemsLista: string[] = [];
  let listaOrdenada = false;

  function vaciarLista() {
    if (itemsLista.length === 0) return;
    if (listaOrdenada) {
      bloques.push(
        <ol
          key={bloques.length}
          className="my-2 list-decimal space-y-1 pl-5"
        >
          {itemsLista.map((item, i) => (
            <li key={i}>
              <FormatoInline texto={item} />
            </li>
          ))}
        </ol>
      );
    } else {
      bloques.push(
        <ul key={bloques.length} className="my-2 list-disc space-y-1 pl-5">
          {itemsLista.map((item, i) => (
            <li key={i}>
              <FormatoInline texto={item} />
            </li>
          ))}
        </ul>
      );
    }
    itemsLista = [];
  }

  for (const linea of lineas) {
    const trimmed = linea.trim();
    const encabezado = trimmed.match(/^###\s+(.+)/);
    const numerada = trimmed.match(/^\d+\.\s+(.+)/);
    const viñeta = trimmed.match(/^[-*•]\s+(.+)/);

    if (numerada) {
      if (itemsLista.length > 0 && !listaOrdenada) vaciarLista();
      listaOrdenada = true;
      itemsLista.push(numerada[1]);
      continue;
    }

    if (viñeta) {
      if (itemsLista.length > 0 && listaOrdenada) vaciarLista();
      listaOrdenada = false;
      itemsLista.push(viñeta[1]);
      continue;
    }

    vaciarLista();
    listaOrdenada = false;

    if (encabezado) {
      bloques.push(
        <p
          key={bloques.length}
          className="mt-3 font-semibold first:mt-0"
        >
          <FormatoInline texto={encabezado[1]} />
        </p>
      );
    } else if (trimmed) {
      bloques.push(
        <p key={bloques.length} className="my-1">
          <FormatoInline texto={trimmed} />
        </p>
      );
    }
  }

  vaciarLista();

  return <div>{bloques}</div>;
}
