"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor, usuarioAtual } from "@/lib/supabase/server";
import type { Diario } from "@/lib/tipos";

export type Payload = Omit<Diario, "autor_id" | "criado_em"> & { novo?: boolean };

export async function salvarDiario(payload: Payload) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const supabase = await clienteServidor();
  const registro = {
    obra_id: payload.obra_id,
    data: payload.data,
    folha: payload.folha,
    clima: payload.clima,
    efetivo: payload.efetivo,
    servicos: payload.servicos,
    materiais: payload.materiais,
    ocorrencias: payload.ocorrencias,
    fotos_assunto: payload.fotos_assunto,
    fotos: payload.fotos,
    ass_rt: payload.ass_rt,
    ass_enc: payload.ass_enc,
    ass_cont: payload.ass_cont,
    ass_rt_img: payload.ass_rt_img,
    ass_enc_img: payload.ass_enc_img,
    ass_cont_img: payload.ass_cont_img,
  };

  if (!payload.novo) {
    const { data, error } = await supabase
      .from("diarios")
      .update(registro)
      .eq("id", payload.id)
      .select("id")
      .maybeSingle();
    if (error) return { erro: traduz(error.message) };
    if (!data) return { erro: "Não foi possível salvar — você não tem permissão nesta obra." };
    revalidatePath("/");
    revalidatePath(`/diarios/${payload.id}`);
    return { id: payload.id };
  }

  const { data, error } = await supabase
    .from("diarios")
    .insert({ id: payload.id, ...registro, autor_id: usuario.id })
    .select("id")
    .single();

  if (error) return { erro: traduz(error.message) };
  revalidatePath("/");
  return { id: data.id as string };
}

export async function excluirDiario(dados: FormData) {
  const id = String(dados.get("id") || "");
  const supabase = await clienteServidor();
  const { error } = await supabase.from("diarios").delete().eq("id", id);
  if (error) throw new Error("Não foi possível excluir: " + error.message);
  revalidatePath("/");
  redirect("/");
}

function traduz(mensagem: string) {
  if (mensagem.includes("duplicate key") || mensagem.includes("diarios_obra_id_data_key")) {
    return "Já existe um diário lançado para esta obra nesta data. Abra o dia no histórico e edite.";
  }
  if (mensagem.includes("row-level security")) {
    return "Você não tem permissão para lançar nesta obra.";
  }
  return "Não foi possível salvar: " + mensagem;
}
