const SALT = "fynix-card-salt-v1";
const SEPARADOR = ".";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function derivarClave(usuarioId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`fynix-tarjetas:${usuarioId}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function cifrarTexto(
  texto: string,
  usuarioId: string
): Promise<string> {
  const clave = await derivarClave(usuarioId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(texto);
  const cifrado = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    clave,
    encoded
  );

  return `${bytesToBase64(iv)}${SEPARADOR}${bytesToBase64(new Uint8Array(cifrado))}`;
}

export async function descifrarTexto(
  payload: string,
  usuarioId: string
): Promise<string | null> {
  try {
    const [ivB64, dataB64] = payload.split(SEPARADOR);
    if (!ivB64 || !dataB64) return null;

    const clave = await derivarClave(usuarioId);
    const iv = base64ToBytes(ivB64);
    const data = base64ToBytes(dataB64);
    const descifrado = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      clave,
      data
    );

    return new TextDecoder().decode(descifrado);
  } catch {
    return null;
  }
}
