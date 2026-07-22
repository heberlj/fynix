import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { urlBaseApp } from "@/lib/app-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const destinoSeguro = next.startsWith("/") ? next : "/login";
  const base = urlBaseApp();

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=auth`);
  }

  const supabase = await crearClienteSupabaseServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error en callback de auth:", error.message);
    return NextResponse.redirect(`${base}/login?error=auth`);
  }

  return NextResponse.redirect(`${base}${destinoSeguro}`);
}
