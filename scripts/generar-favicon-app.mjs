import sharp from "sharp";
import { resolve } from "node:path";

const TAMANO = 512;
const ESCALA_LOGO = 0.88;

const sinFondo = process.argv.includes("--sin-fondo");
const args = process.argv.filter((a) => !a.startsWith("--"));
const origen = resolve(args[2] ?? "app/icon.png");

const salidas = [
  resolve("app/icon.png"),
  resolve("app/apple-icon.png"),
];

async function quitarFondoOscuro(entrada) {
  const { data, info } = await sharp(entrada)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturacion = max === 0 ? 0 : (max - min) / max;

    const esFondoOscuro =
      luminancia < 52 && saturacion < 0.35 && r < 70 && g < 70 && b < 90;

    if (esFondoOscuro) {
      data[i + 3] = 0;
    } else if (luminancia < 62 && saturacion < 0.25) {
      data[i + 3] = Math.min(
        data[i + 3],
        Math.round(((luminancia - 40) / 22) * 255)
      );
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function logoProcesado() {
  const meta = await sharp(origen).metadata();
  const yaTieneAlpha = (meta.channels ?? 3) === 4;

  if (sinFondo && yaTieneAlpha) {
    return sharp(origen).png().toBuffer();
  }

  return quitarFondoOscuro(origen);
}

async function generarTransparente(logoSinFondo) {
  const meta = await sharp(logoSinFondo).metadata();
  const anchoLogo = Math.round(TAMANO * ESCALA_LOGO);
  const altoLogo = Math.round(
    (anchoLogo * (meta.height ?? TAMANO)) / (meta.width ?? TAMANO)
  );

  const logo = await sharp(logoSinFondo)
    .resize(anchoLogo, altoLogo, { fit: "inside" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: TAMANO,
      height: TAMANO,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function generarConFondo(logoSinFondo) {
  const RADIO_ESQUINAS = Math.round(TAMANO * 0.22);
  const COLOR_FONDO = "#2563eb";
  const ESCALA_CON_FONDO = 0.62;

  const meta = await sharp(logoSinFondo).metadata();
  const anchoLogo = Math.round(TAMANO * ESCALA_CON_FONDO);
  const altoLogo = Math.round(
    (anchoLogo * (meta.height ?? TAMANO)) / (meta.width ?? TAMANO)
  );

  const logo = await sharp(logoSinFondo)
    .resize(anchoLogo, altoLogo, { fit: "inside" })
    .png()
    .toBuffer();

  const logoMeta = await sharp(logo).metadata();
  const offsetX = Math.round((TAMANO - (logoMeta.width ?? 0)) / 2);
  const offsetY = Math.round((TAMANO - (logoMeta.height ?? 0)) / 2);

  const svg = `
    <svg width="${TAMANO}" height="${TAMANO}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${TAMANO}" height="${TAMANO}" rx="${RADIO_ESQUINAS}" ry="${RADIO_ESQUINAS}" fill="${COLOR_FONDO}" />
    </svg>
  `;

  const fondo = await sharp(Buffer.from(svg)).png().toBuffer();

  return sharp(fondo)
    .composite([{ input: logo, left: offsetX, top: offsetY }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const logoSinFondo = await logoProcesado();
const icono = sinFondo
  ? await generarTransparente(logoSinFondo)
  : await generarConFondo(logoSinFondo);

for (const salida of salidas) {
  await sharp(icono).toFile(salida);
  console.log("Guardado:", salida);
}
