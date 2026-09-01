"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";
import { hoje } from "@/lib/tipos";

export async function criarObra(dados: FormData) {
  const nome = String(dados.get("nome") || "").trim() || "Obra sem nome";
  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("criar_obra", { p_nome: nome });
  if (error) throw new Error("Não foi possível criar a obra: " + error.message);
  revalidatePath("/obras");
  redirect(`/obras/${data}`);
}

export async function salvarObra(dados: FormData) {
  const id = String(dados.get("id") || "");
  const prazo = String(dados.get("prazo") || "") || null;

  if (prazo && prazo < hoje()) {
    redirect(`/obras/${id}?obra=erro_prazo`);
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from("obras")
    .update({
      nome: String(dados.get("nome") || "").trim() || "Obra sem nome",
      endereco: String(dados.get("endereco") || ""),
      contratante: String(dados.get("contratante") || ""),
      executante: String(dados.get("executante") || ""),
      rt: String(dados.get("rt") || ""),
      crea: String(dados.get("crea") || ""),
      art: String(dados.get("art") || ""),
      inicio: String(dados.get("inicio") || "") || null,
      prazo,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error("Não foi possível salvar a obra: " + error.message);

  revalidatePath("/obras");
  revalidatePath(`/obras/${id}`);

  if (!data) redirect(`/obras/${id}?obra=erro`);
  redirect(`/obras/${id}?obra=ok`);
}

export async function excluirObra(dados: FormData) {
  const id = String(dados.get("id") || "");
  const supabase = await clienteServidor();
  const { error } = await supabase.from("obras").delete().eq("id", id);
  if (error) throw new Error("Não foi possível excluir a obra: " + error.message);
  revalidatePath("/obras");
  redirect("/obras");
}

export async function adicionarMembro(dados: FormData) {
  const obraId = String(dados.get("obra_id") || "");
  const email = String(dados.get("email") || "").trim();
  const papel = String(dados.get("papel") || "campo");

  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("adicionar_membro", {
    p_obra: obraId,
    p_email: email,
    p_papel: papel,
  });

  revalidatePath(`/obras/${obraId}`);

  if (error) redirect(`/obras/${obraId}?membro=erro`);
  if (data === "nao_encontrado") redirect(`/obras/${obraId}?membro=nao_encontrado`);
  redirect(`/obras/${obraId}?membro=ok`);
}

export async function removerMembro(dados: FormData) {
  const obraId = String(dados.get("obra_id") || "");
  const userId = String(dados.get("user_id") || "");
  const supabase = await clienteServidor();
  await supabase.from("obra_membros").delete().eq("obra_id", obraId).eq("user_id", userId);
  revalidatePath(`/obras/${obraId}`);
  redirect(`/obras/${obraId}`);
}
