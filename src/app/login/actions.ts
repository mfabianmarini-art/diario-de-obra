"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";

export type EstadoAuth = { erro?: string; aviso?: string };

export async function entrar(_estado: EstadoAuth, dados: FormData): Promise<EstadoAuth> {
  const email = String(dados.get("email") || "").trim();
  const senha = String(dados.get("senha") || "");
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return {
      erro:
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar: " + error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cadastrar(_estado: EstadoAuth, dados: FormData): Promise<EstadoAuth> {
  const nome = String(dados.get("nome") || "").trim();
  const email = String(dados.get("email") || "").trim();
  const senha = String(dados.get("senha") || "");
  if (!email || senha.length < 8) {
    return { erro: "Informe o e-mail e uma senha de pelo menos 8 caracteres." };
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (error) return { erro: "Não foi possível criar a conta: " + error.message };

  if (!data.session) {
    return { aviso: "Conta criada. Confirme o e-mail que enviamos e depois faça login." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function sair() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
