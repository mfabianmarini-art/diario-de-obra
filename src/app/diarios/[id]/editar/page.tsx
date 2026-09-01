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

  const assinar = (path: string | null) =>
    path
      ? supabase.storage
          .from("diario-anexos")
          .createSignedUrl(path, 60 * 60 * 24)
          .then((r) => r.data?.signedUrl || null)
      : Promise.resolve(null);

  const [fotosPares, ass_rt, ass_enc, ass_cont] = await Promise.all([
    Promise.all(
      (d.fotos || []).map(async (f) => [
        f.path,
        await supabase.storage
          .from("diario-anexos")
          .createSignedUrl(f.path, 60 * 60 * 24)
          .then((r) => r.data?.signedUrl || ""),
      ] as const)
    ),
    assinar(d.ass_rt_img),
    assinar(d.ass_enc_img),
    assinar(d.ass_cont_img),
  ]);

  const inicial: Payload = {
    id: d.id,
    obra_id: d.obra_id,
    data: d.data.slice(0, 10),
    folha: d.folha,
    clima: d.clima,
    efetivo: d.efetivo || [],
    servicos: d.servicos || [],
    materiais: d.materiais || [],
    ocorrencias: d.ocorrencias,
    fotos_assunto: d.fotos_assunto,
    fotos: d.fotos || [],
    ass_rt: d.ass_rt,
    ass_enc: d.ass_enc,
    ass_cont: d.ass_cont,
    ass_rt_img: d.ass_rt_img,
    ass_enc_img: d.ass_enc_img,
    ass_cont_img: d.ass_cont_img,
  };

  return (
    <>
      <TopBar email={usuario?.email} voltar={`/diarios/${id}`} />
      <div className="wrap">
        <DiarioForm
          obras={obras || []}
          inicial={inicial}
          fotosUrls={Object.fromEntries(fotosPares)}
          assinaturasUrls={{ rt: ass_rt, enc: ass_enc, cont: ass_cont }}
        />
      </div>
    </>
  );
}
