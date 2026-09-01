import {
  dataBr,
  diaDaSemana,
  praticabilidade,
  totalEfetivo,
  type Diario,
  type Obra,
} from "@/lib/tipos";

export default function Folha({ diario, obra }: { diario: Diario; obra: Obra }) {
  const efetivo = (diario.efetivo || []).filter((e) => e.funcao && Number(e.qtd) > 0);
  const linhas = Math.max(2, Math.ceil(efetivo.length / 2));
  const servicos = (diario.servicos || []).filter((s) => s.desc || s.local || s.qtd);
  const materiais = (diario.materiais || []).filter((m) => m.item || m.nf || m.qtd);

  return (
    <div className="sheet">
      <div className="sh-head">
        <div>
          <span className="mark" style={{ fontSize: 22 }}>
            CAPE<small>Consultoria, Avaliações e Perícias de Engenharia</small>
          </span>
        </div>
        <div className="sh-title">
          Diário de Obra<span>Modelo A — Simplificado</span>
        </div>
        <div className="sh-id">
          Folha nº <b>{diario.folha || "—"}</b>
          <br />
          Data <b>{dataBr(diario.data)}</b>
          <br />
          {diaDaSemana(diario.data)}
        </div>
      </div>

      <Bloco n="1" titulo="Identificação">
        <div className="sh-g">
          <Campo r="Obra / empreendimento" v={obra.nome} c="c8" />
          <Campo r="ART / RRT nº" v={obra.art} c="c4" />
          <Campo r="Endereço" v={obra.endereco} c="c8" />
          <Campo r="Início / prazo" v={[dataBr(obra.inicio), obra.prazo].filter(Boolean).join(" · ")} c="c4" />
          <Campo r="Contratante / proprietário" v={obra.contratante} c="c6" />
          <Campo r="Executante" v={obra.executante} c="c6" />
          <Campo r="Responsável técnico" v={obra.rt} c="c8" />
          <Campo r="CREA / CAU nº" v={obra.crea} c="c4" />
        </div>
      </Bloco>

      <Bloco n="2" titulo="Condições climáticas">
        <div className="sh-g">
          <Campo r="Manhã" v={diario.clima?.manha} c="c3" />
          <Campo r="Tarde" v={diario.clima?.tarde} c="c3" />
          <Campo
            r="Horas paradas por chuva"
            v={diario.clima?.horasParadas ? `${diario.clima.horasParadas} h` : ""}
            c="c3"
          />
          <Campo r="Praticabilidade" v={praticabilidade(diario.clima)} c="c3" />
          <Campo r="Observação" v={diario.clima?.obs} c="" />
        </div>
      </Bloco>

      <Bloco n="3" titulo="Efetivo em obra">
        <div className="tscroll">
          <table className="sh-t">
            <tbody>
              <tr>
                <th>Função</th>
                <th style={{ width: 80 }}>Qtd.</th>
                <th>Função</th>
                <th style={{ width: 80 }}>Qtd.</th>
              </tr>
              {Array.from({ length: linhas }).map((_, i) => {
                const a = efetivo[i * 2];
                const b = efetivo[i * 2 + 1];
                return (
                  <tr key={i}>
                    <td>{a?.funcao || ""}</td>
                    <td>{a ? a.qtd : ""}</td>
                    <td>{b?.funcao || ""}</td>
                    <td>{b ? b.qtd : ""}</td>
                  </tr>
                );
              })}
              <tr>
                <th colSpan={3} style={{ textAlign: "right" }}>
                  Total de pessoas no dia
                </th>
                <th>{totalEfetivo(diario.efetivo)}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </Bloco>

      <Bloco n="4" titulo="Serviços executados no dia">
        <div className="tscroll">
          <table className="sh-t">
            <tbody>
              <tr>
                <th style={{ width: "24%" }}>Local / pavimento</th>
                <th>Serviço</th>
                <th style={{ width: "22%" }}>Quantidade ou %</th>
              </tr>
              {servicos.length ? (
                servicos.map((s, i) => (
                  <tr key={i}>
                    <td>{s.local}</td>
                    <td>{s.desc}</td>
                    <td>{s.qtd}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Bloco>

      <Bloco n="5" titulo="Materiais e equipamentos recebidos">
        <div className="tscroll">
          <table className="sh-t">
            <tbody>
              <tr>
                <th style={{ width: "48%" }}>Material / equipamento</th>
                <th style={{ width: "26%" }}>Nota fiscal nº</th>
                <th style={{ width: "26%" }}>Quantidade</th>
              </tr>
              {materiais.length ? (
                materiais.map((m, i) => (
                  <tr key={i}>
                    <td>{m.item}</td>
                    <td>{m.nf}</td>
                    <td>{m.qtd}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Bloco>

      <Bloco n="6" titulo="Ocorrências, orientações e pendências">
        <div className="sh-pre">{diario.ocorrencias || "—"}</div>
      </Bloco>

      <Bloco n="7" titulo="Registro fotográfico" hint="anexo">
        <div className="sh-g">
          <Campo r="Nº de fotos anexas" v={diario.fotos_qtd} c="c4" />
          <Campo r="Assunto das fotos" v={diario.fotos_assunto} c="c8" />
        </div>
      </Bloco>

      <div className="sh-sign">
        <div>
          <b>{diario.ass_rt || " "}</b>
          Responsável técnico — CREA/CAU {obra.crea || ""}
        </div>
        <div>
          <b>{diario.ass_enc || " "}</b>
          Encarregado / preposto
        </div>
        <div>
          <b>{diario.ass_cont || " "}</b>
          Contratante ou fiscal — ciência
        </div>
      </div>
    </div>
  );
}

function Bloco({
  n,
  titulo,
  hint,
  children,
}: {
  n: string;
  titulo: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sh-blk">
      <div className="sh-bh">
        <span className="blk-n">{n}</span>
        <h4>{titulo}</h4>
        {hint ? <span className="hint">{hint}</span> : null}
      </div>
      <div className="sh-bb">{children}</div>
    </div>
  );
}

function Campo({ r, v, c }: { r: string; v?: string | null; c: string }) {
  return (
    <div className={`sh-f ${c}`}>
      <i>{r}</i>
      <b>{v || "—"}</b>
    </div>
  );
}
