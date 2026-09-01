import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import DiarioForm from "@/components/DiarioForm";
import { clienteServidor, usuarioAtual } from "@/lib/supabase/server";
import type { Diario } from "@/lib/tipos";
import type { Payload } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarDiario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const supabase = await clienteServidor();

  const { data } = await supabase.from("diarios").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const { data: obras } = await supabase.from("obras").select("id, nome").order("nome");
  const d = data as Diario;

  const inicial: Payload = {
    obra_id: d.obra_id,
    data: d.data.slice(0, 10),
    folha: d.folha,
    clima: d.clima,
    efetivo: d.efetivo || [],
    servicos: d.servicos || [],
    materiais: d.materiais || [],
    ocorrencias: d.ocorrencias,
    fotos_qtd: d.fotos_qtd,
    fotos_assunto: d.fotos_assunto,
    ass_rt: d.ass_rt,
    ass_enc: d.ass_enc,
    ass_cont: d.ass_cont,
  };

  return (
    <>
      <TopBar email={usuario?.email} voltar={`/diarios/${id}`} />
      <div className="wrap">
        <DiarioForm obras={obras || []} inicial={inicial} idExistente={id} />
      </div>
    </>
  );
}
