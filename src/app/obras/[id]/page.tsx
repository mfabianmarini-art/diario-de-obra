import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import { clienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { adicionarMembro, excluirObra, removerMembro, salvarObra } from "../actions";

export const dynamic = "force-dynamic";

const AVISOS: Record<string, string> = {
  ok: "Pessoa adicionada à obra.",
  nao_encontrado:
    "Ninguém com esse e-mail tem conta ainda. Peça para a pessoa criar a conta e tente de novo.",
  erro: "Não foi possível adicionar — só o gestor da obra pode fazer isso.",
};

export default async function PaginaObra({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ membro?: string }>;
}) {
  const { id } = await params;
  const { membro } = await searchParams;
  const usuario = await usuarioAtual();
  const supabase = await clienteServidor();

  const { data: obra } = await supabase.from("obras").select("*").eq("id", id).maybeSingle();
  if (!obra) notFound();

  const { data: membros } = await supabase
    .from("obra_membros")
    .select("user_id, papel, perfis:user_id (nome)")
    .eq("obra_id", id);

  const souGestor = membros?.some((m) => m.user_id === usuario?.id && m.papel === "gestor");

  return (
    <>
      <TopBar email={usuario?.email} voltar="/obras" />
      <div className="wrap">
        <div className="listhead">
          <h2>{obra.nome}</h2>
        </div>

        {membro && AVISOS[membro] ? <p className="aviso">{AVISOS[membro]}</p> : null}

        <form action={salvarObra}>
          <input type="hidden" name="id" value={obra.id} />
          <div className="blk">
            <div className="blk-h">
              <span className="blk-n">1</span>
              <h3>Dados do cabeçalho</h3>
              <span className="hint">saem impressos em toda folha</span>
            </div>
            <div className="blk-b">
              <div className="fields">
                <Campo n="nome" r="Obra / empreendimento" v={obra.nome} c="f-8" />
                <Campo n="art" r="ART / RRT nº" v={obra.art} c="f-4" />
                <Campo n="endereco" r="Endereço" v={obra.endereco} c="f-8" />
                <Campo n="prazo" r="Prazo" v={obra.prazo} c="f-4" />
                <Campo n="contratante" r="Contratante / proprietário" v={obra.contratante} c="f-6" />
                <Campo n="executante" r="Executante" v={obra.executante} c="f-6" />
                <Campo n="rt" r="Responsável técnico" v={obra.rt} c="f-4" />
                <Campo n="crea" r="CREA / CAU nº" v={obra.crea} c="f-4" />
                <div className="f f-4">
                  <label htmlFor="inicio">Início da obra</label>
                  <input id="inicio" name="inicio" type="date" defaultValue={obra.inicio || ""} />
                </div>
              </div>
              <div className="addbar">
                <button className="btn primary" type="submit" disabled={!souGestor}>
                  Salvar obra
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="blk">
          <div className="blk-h">
            <span className="blk-n">2</span>
            <h3>Quem lança nesta obra</h3>
          </div>
          <div className="blk-b">
            <div className="rows">
              {membros?.map((m) => {
                const perfil = m.perfis as unknown as { nome?: string } | null;
                return (
                  <div className="row" key={m.user_id} style={{ cursor: "default" }}>
                    <span className="rdate">
                      <b>{m.papel === "gestor" ? "G" : "C"}</b>
                      <span>{m.papel}</span>
                    </span>
                    <span className="rmain">
                      <b>{perfil?.nome || "Sem nome"}</b>
                      <span className="rmeta">
                        <span>{m.user_id === usuario?.id ? "você" : "equipe"}</span>
                      </span>
                    </span>
                    {souGestor && m.user_id !== usuario?.id ? (
                      <form action={removerMembro}>
                        <input type="hidden" name="obra_id" value={obra.id} />
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <button className="btn sm danger" type="submit">
                          Remover
                        </button>
                      </form>
                    ) : (
                      <span className="chevron" />
                    )}
                  </div>
                );
              })}
            </div>

            {souGestor ? (
              <form action={adicionarMembro} className="addbar" style={{ marginTop: 16 }}>
                <input type="hidden" name="obra_id" value={obra.id} />
                <input
                  name="email"
                  type="email"
                  placeholder="e-mail de quem já tem conta"
                  required
                  style={{ flex: "1 1 220px" }}
                />
                <select name="papel" style={{ flex: "0 1 150px" }}>
                  <option value="campo">Campo</option>
                  <option value="gestor">Gestor</option>
                </select>
                <button className="btn" type="submit">
                  Adicionar
                </button>
              </form>
            ) : (
              <p className="msg" style={{ marginTop: 14 }}>
                Só o gestor da obra pode incluir ou remover pessoas.
              </p>
            )}
          </div>
        </div>

        {souGestor ? (
          <form action={excluirObra}>
            <input type="hidden" name="id" value={obra.id} />
            <button className="btn danger" type="submit">
              Excluir obra e todos os diários
            </button>
          </form>
        ) : null}
      </div>
    </>
  );
}

function Campo({ n, r, v, c }: { n: string; r: string; v: string | null; c: string }) {
  return (
    <div className={`f ${c}`}>
      <label htmlFor={n}>{r}</label>
      <input id={n} name={n} type="text" defaultValue={v || ""} />
    </div>
  );
}
