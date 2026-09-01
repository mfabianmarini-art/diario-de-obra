import Link from "next/link";
import TopBar from "@/components/TopBar";
import DiarioForm from "@/components/DiarioForm";
import { clienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { hoje, type ItemEfetivo } from "@/lib/tipos";
import type { Payload } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoDiario({
  searchParams,
}: {
  searchParams: Promise<{ obra?: string }>;
}) {
  const { obra } = await searchParams;
  const usuario = await usuarioAtual();
  const supabase = await clienteServidor();

  const { data: obras } = await supabase.from("obras").select("id, nome").order("nome");

  if (!obras?.length) {
    return (
      <>
        <TopBar email={usuario?.email} voltar="/" />
        <div className="wrap">
          <div className="empty">
            <b>Cadastre uma obra primeiro</b>
            <p>O diário sempre pertence a uma obra — é dela que vem o cabeçalho da folha.</p>
            <Link className="btn primary" href="/obras">
              Ir para obras
            </Link>
          </div>
        </div>
      </>
    );
  }

  const obraId = obra && obras.some((o) => o.id === obra) ? obra : obras[0].id;

  const { data: ultimo } = await supabase
    .from("diarios")
    .select("folha, efetivo, ass_rt, ass_enc, ass_cont")
    .eq("obra_id", obraId)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  const proxima = String((Number(ultimo?.folha) || 0) + 1);
  const efetivo = (ultimo?.efetivo as ItemEfetivo[] | undefined)?.length
    ? (ultimo!.efetivo as ItemEfetivo[])
    : [
        { funcao: "Encarregado", qtd: 1 },
        { funcao: "Pedreiro", qtd: 1 },
        { funcao: "Servente", qtd: 1 },
      ];

  const inicial: Payload = {
    obra_id: obraId,
    data: hoje(),
    folha: proxima,
    clima: { manha: "Bom", tarde: "Bom", horasParadas: "", obs: "" },
    efetivo,
    servicos: [{ local: "", desc: "", qtd: "" }],
    materiais: [],
    ocorrencias: "",
    fotos_qtd: "",
    fotos_assunto: "",
    ass_rt: ultimo?.ass_rt || "",
    ass_enc: ultimo?.ass_enc || "",
    ass_cont: ultimo?.ass_cont || "",
  };

  return (
    <>
      <TopBar email={usuario?.email} voltar="/" />
      <div className="wrap">
        <DiarioForm obras={obras} inicial={inicial} />
      </div>
    </>
  );
}
