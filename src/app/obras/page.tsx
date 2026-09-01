import Link from "next/link";
import TopBar from "@/components/TopBar";
import { clienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { criarObra } from "./actions";

export const dynamic = "force-dynamic";

export default async function PaginaObras() {
  const usuario = await usuarioAtual();
  const supabase = await clienteServidor();

  const { data: obras } = await supabase
    .from("obras")
    .select("id, nome, endereco, contratante")
    .order("nome");

  return (
    <>
      <TopBar email={usuario?.email} voltar="/" />
      <div className="wrap">
        <div className="listhead">
          <h2>Obras</h2>
        </div>

        <div className="blk">
          <div className="blk-h">
            <span className="blk-n">+</span>
            <h3>Nova obra</h3>
          </div>
          <div className="blk-b">
            <form action={criarObra} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                name="nome"
                type="text"
                placeholder="Nome da obra"
                required
                style={{ flex: "1 1 240px" }}
              />
              <button className="btn primary" type="submit">
                Cadastrar
              </button>
            </form>
          </div>
        </div>

        {!obras?.length ? (
          <div className="empty">
            <b>Nenhuma obra cadastrada</b>
            <p>Cadastre a obra uma vez: o cabeçalho da folha e a numeração passam a ser automáticos.</p>
          </div>
        ) : (
          <div className="rows">
            {obras.map((o) => (
              <Link className="row" key={o.id} href={`/obras/${o.id}`}>
                <span className="rdate">
                  <b>·</b>
                </span>
                <span className="rmain">
                  <b>{o.nome}</b>
                  <span className="rmeta">
                    <span>{o.contratante || "sem contratante"}</span>
                    <span>{o.endereco || "sem endereço"}</span>
                  </span>
                </span>
                <span className="chevron">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
