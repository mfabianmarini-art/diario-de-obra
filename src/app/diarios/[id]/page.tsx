import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import Folha from "@/components/Folha";
import BotaoImprimir from "@/components/BotaoImprimir";
import { clienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { excluirDiario } from "../actions";
import type { Diario, Obra } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function PaginaFolha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const supabase = await clienteServidor();

  const { data } = await supabase
    .from("diarios")
    .select("*, obras(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const { obras, ...diario } = data as Diario & { obras: Obra };

  const assinar = (path: string | null) =>
    path
      ? supabase.storage
          .from("diario-anexos")
          .createSignedUrl(path, 60 * 60 * 24)
          .then((r) => r.data?.signedUrl || null)
      : Promise.resolve(null);

  const [fotosUrls, ass_rt, ass_enc, ass_cont] = await Promise.all([
    Promise.all(
      (diario.fotos || []).map((f) =>
        supabase.storage
          .from("diario-anexos")
          .createSignedUrl(f.path, 60 * 60 * 24)
          .then((r) => r.data?.signedUrl)
      )
    ),
    assinar(diario.ass_rt_img),
    assinar(diario.ass_enc_img),
    assinar(diario.ass_cont_img),
  ]);

  return (
    <>
      <TopBar email={usuario?.email} voltar="/" />
      <div className="wrap">
        <div className="pgactions noprint">
          <BotaoImprimir />
          <Link className="btn" href={`/diarios/${id}/editar`}>
            Editar
          </Link>
          <Link className="btn" href={`/diarios/novo?obra=${diario.obra_id}`}>
            Novo dia nesta obra
          </Link>
          <form action={excluirDiario}>
            <input type="hidden" name="id" value={id} />
            <button className="btn danger" type="submit">
              Excluir
            </button>
          </form>
        </div>

        <Folha
          diario={diario as Diario}
          obra={obras}
          fotosUrls={fotosUrls.filter((u): u is string => !!u)}
          assinaturasUrls={{ rt: ass_rt, enc: ass_enc, cont: ass_cont }}
        />
      </div>
    </>
  );
}
