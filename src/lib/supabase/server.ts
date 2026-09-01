import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

type CookieParaGravar = { name: string; value: string; options: CookieOptions };

export async function clienteServidor() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(lista: CookieParaGravar[]) {
          try {
            lista.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // chamado a partir de um Server Component: o middleware renova a sessão
          }
        },
      },
    }
  );
}

export async function usuarioAtual() {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
