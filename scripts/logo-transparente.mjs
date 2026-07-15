import sharp from "sharp";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const origen = resolve(
  "assets/c__Users_hlope_AppData_Roaming_Cursor_User_workspaceStorage_25c9ae04ec93922d378e690ab5b2a88c_images_ChatGPT_Image_Jul_14__2026__10_14_30_PM-removebg-preview-977b50f3-3b2f-46d5-9c55-097af00f697b.png"
);

const salidas = [
  resolve("public/logo-fynix.png"),
  resolve("public/icon.png"),
  resolve("app/icon.png"),
];

async function quitarFondoNegro(entrada, salida) {
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

    if (luminancia < 18) {
      data[i + 3] = 0;
    } else if (luminancia < 42) {
      data[i + 3] = Math.min(
        data[i + 3],
        Math.round(((luminancia - 18) / 24) * 255)
      );
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(salida);
}

const entrada = process.argv[2] ? resolve(process.argv[2]) : origen;

for (const salida of salidas) {
  await quitarFondoNegro(entrada, salida);
  console.log("Guardado:", salida);
}
