import Link from "next/link";
import TopBar from "@/components/TopBar";
import { clienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { totalEfetivo, type Clima, type ItemEfetivo, type ItemServico } from "@/lib/tipos";

export const dynamic = "force-dynamic";

type Linha = {
  id: string;
  data: string;
  folha: string;
  clima: Clima;
  efetivo: ItemEfetivo[];
  servicos: ItemServico[];
  obras: { nome: string } | null;
};

export default async function Historico({
  searchParams,
}: {
  searchParams: Promise<{ obra?: string }>;
}) {
  const { obra } = await searchParams;
  const usuario = await usuarioAtual();
  const supabase = await clienteServidor();

  const { data: obras } = await supabase.from("obras").select("id, nome").order("nome");

  let consulta = supabase
    .from("diarios")
    .select("id, data, folha, clima, efetivo, servicos, obras(nome)")
    .order("data", { ascending: false })
    .limit(200);

  if (obra) consulta = consulta.eq("obra_id", obra);

  const { data } = await consulta;
  const linhas = (data || []) as unknown as Linha[];

  return (
    <>
      <TopBar email={usuario?.email} />
      <div className="wrap">
        <div className="listhead">
          <h2>Histórico</h2>
          <span className="grow" />
          <Link className="btn sm" href="/obras">
            Obras
          </Link>
          <Link className="btn primary" href={obra ? `/diarios/novo?obra=${obra}` : "/diarios/novo"}>
            + Novo diário
          </Link>
        </div>

        {obras && obras.length > 1 ? (
          <div className="chips">
            <Link className="chip" data-ativo={obra ? "0" : "1"} href="/">
              Todas
            </Link>
            {obras.map((o) => (
              <Link
                key={o.id}
                className="chip"
                data-ativo={obra === o.id ? "1" : "0"}
                href={`/?obra=${o.id}`}
              >
                {o.nome}
              </Link>
            ))}
          </div>
        ) : null}

        {!obras?.length ? (
          <div className="empty">
            <b>Cadastre a primeira obra</b>
            <p>Os dados do cabeçalho ficam salvos na obra e saem impressos em toda folha.</p>
            <Link className="btn primary" href="/obras">
              Ir para obras
            </Link>
          </div>
        ) : !linhas.length ? (
          <div className="empty">
            <b>Nenhum diário ainda</b>
            <p>Comece o registro do dia. Leva menos de cinco minutos no celular.</p>
            <Link className="btn primary" href="/diarios/novo">
              + Novo diário
            </Link>
          </div>
        ) : (
          <div className="rows">
            {linhas.map((d) => {
              const [ano, mes, dia] = d.data.slice(0, 10).split("-");
              const horas = Number(d.clima?.horasParadas) || 0;
              const impraticavel =
                d.clima?.manha === "Impraticável" || d.clima?.tarde === "Impraticável";
              return (
                <Link className="row" key={d.id} href={`/diarios/${d.id}`}>
                  <span className="rdate">
                    <b>{dia}</b>
                    <span>
                      {mes}/{ano}
                    </span>
                  </span>
                  <span className="rmain">
                    <b>{d.obras?.nome || "Obra"}</b>
                    <span className="rmeta">
                      <span>Folha {d.folha || "—"}</span>
                      <span>{totalEfetivo(d.efetivo)} na obra</span>
                      <span>{(d.servicos || []).filter((s) => s.desc).length} serviços</span>
                      {horas || impraticavel ? (
                        <span className="w">
                          {impraticavel ? "Impraticável" : ""}
                          {horas ? `${impraticavel ? " · " : ""}${horas}h paradas` : ""}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="chevron">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
