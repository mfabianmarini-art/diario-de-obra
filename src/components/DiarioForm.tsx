"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { salvarDiario, type Payload } from "@/app/diarios/actions";
import { clienteNavegador } from "@/lib/supabase/client";
import AssinaturaPad, { type AssinaturaPadHandle } from "@/components/AssinaturaPad";
import {
  CLIMA_OPCOES,
  FUNCOES,
  diaDaSemana,
  totalEfetivo,
  type Clima,
  type Diario,
  type ItemEfetivo,
  type ItemMaterial,
  type ItemServico,
} from "@/lib/tipos";

type FotoUI = { tempId: string; path: string; url: string; enviando: boolean; erro?: boolean };

type Props = {
  obras: { id: string; nome: string }[];
  inicial: Payload;
  novo?: boolean;
  fotosUrls: Record<string, string>;
  assinaturasUrls: { rt?: string | null; enc?: string | null; cont?: string | null };
};

export default function DiarioForm({ obras, inicial, novo, fotosUrls, assinaturasUrls }: Props) {
  const router = useRouter();
  const [d, setD] = useState<Payload>(inicial);
  const [fotos, setFotos] = useState<FotoUI[]>(
    inicial.fotos.map((f) => ({
      tempId: f.path,
      path: f.path,
      url: fotosUrls[f.path] || "",
      enviando: false,
    }))
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const padRT = useRef<AssinaturaPadHandle>(null);
  const padEnc = useRef<AssinaturaPadHandle>(null);
  const padCont = useRef<AssinaturaPadHandle>(null);

  const set = <K extends keyof Payload>(campo: K, valor: Payload[K]) =>
    setD((v) => ({ ...v, [campo]: valor }));

  const setClima = (campo: keyof Clima, valor: string) =>
    setD((v) => ({ ...v, clima: { ...v.clima, [campo]: valor } }));

  async function adicionarFotos(lista: FileList | null) {
    if (!lista || !lista.length) return;
    const arquivos = Array.from(lista);
    const novas: FotoUI[] = arquivos.map((file) => ({
      tempId: crypto.randomUUID(),
      path: "",
      url: URL.createObjectURL(file),
      enviando: true,
    }));
    setFotos((atual) => [...atual, ...novas]);

    const supabase = clienteNavegador();
    await Promise.all(
      arquivos.map(async (file, i) => {
        const tempId = novas[i].tempId;
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${d.obra_id}/${d.id}/foto-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("diario-anexos")
          .upload(path, file, { contentType: file.type || "image/jpeg" });
        setFotos((atual) =>
          atual.map((f) =>
            f.tempId === tempId
              ? { ...f, path: error ? "" : path, enviando: false, erro: !!error }
              : f
          )
        );
      })
    );
  }

  async function removerFoto(tempId: string) {
    const alvo = fotos.find((f) => f.tempId === tempId);
    setFotos((atual) => atual.filter((f) => f.tempId !== tempId));
    if (alvo?.path) {
      await clienteNavegador().storage.from("diario-anexos").remove([alvo.path]);
    }
  }

  async function assinaturaPara(
    pad: React.RefObject<AssinaturaPadHandle | null>,
    atual: string | null,
    nomeArquivo: string
  ): Promise<string | null> {
    const handle = pad.current;
    if (!handle) return atual;
    if (handle.foiLimpo()) return null;
    if (!handle.foiAlterado()) return atual;
    const blob = await handle.paraBlob();
    if (!blob) return atual;
    const path = `${d.obra_id}/${d.id}/${nomeArquivo}.png`;
    const { error } = await clienteNavegador()
      .storage.from("diario-anexos")
      .upload(path, blob, { contentType: "image/png", upsert: true });
    return error ? atual : path;
  }

  const salvar = () =>
    iniciar(async () => {
      setErro(null);

      const [ass_rt_img, ass_enc_img, ass_cont_img] = await Promise.all([
        assinaturaPara(padRT, d.ass_rt_img, "assinatura-rt"),
        assinaturaPara(padEnc, d.ass_enc_img, "assinatura-enc"),
        assinaturaPara(padCont, d.ass_cont_img, "assinatura-cont"),
      ]);

      const r = await salvarDiario({
        ...d,
        novo,
        fotos: fotos.filter((f) => f.path).map((f) => ({ path: f.path })),
        ass_rt_img,
        ass_enc_img,
        ass_cont_img,
      });
      if (r?.erro) setErro(r.erro);
      else if (r?.id) router.push(`/diarios/${r.id}`);
    });

  return (
    <>
      {/* 1 — identificação */}
      <Bloco n="1" titulo="Identificação">
        <div className="fields">
          <div className="f f-6">
            <label htmlFor="obra">Obra</label>
            <select
              id="obra"
              value={d.obra_id}
              onChange={(e) => set("obra_id", e.target.value)}
            >
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="f f-3">
            <label htmlFor="data">Data</label>
            <input
              id="data"
              type="date"
              value={d.data}
              onChange={(e) => set("data", e.target.value)}
            />
          </div>
          <div className="f f-3">
            <label htmlFor="folha">Folha nº</label>
            <input
              id="folha"
              type="text"
              inputMode="numeric"
              value={d.folha}
              onChange={(e) => set("folha", e.target.value)}
            />
          </div>
          <div className="f">
            <span className="lbl">Dia da semana</span>
            <span className="msg">{diaDaSemana(d.data)}</span>
          </div>
        </div>
      </Bloco>

      {/* 2 — clima */}
      <Bloco n="2" titulo="Condições climáticas" hint="registro do dia">
        <div className="fields">
          <div className="f f-6">
            <span className="lbl">Manhã</span>
            <Segmento valor={d.clima.manha} aoEscolher={(v) => setClima("manha", v)} />
          </div>
          <div className="f f-6">
            <span className="lbl">Tarde</span>
            <Segmento valor={d.clima.tarde} aoEscolher={(v) => setClima("tarde", v)} />
          </div>
          <div className="f f-4">
            <label htmlFor="hp">Horas paradas por chuva</label>
            <input
              id="hp"
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              value={d.clima.horasParadas}
              onChange={(e) => setClima("horasParadas", e.target.value)}
            />
          </div>
          <div className="f f-8">
            <label htmlFor="cobs">Observação sobre a praticabilidade</label>
            <input
              id="cobs"
              type="text"
              value={d.clima.obs}
              onChange={(e) => setClima("obs", e.target.value)}
            />
          </div>
        </div>
      </Bloco>

      {/* 3 — efetivo */}
      <Bloco n="3" titulo="Efetivo em obra">
        <div className="rep">
          {d.efetivo.map((e, i) => (
            <div className="rep-i eq" key={i}>
              <div>
                <input
                  type="text"
                  placeholder="Função"
                  value={e.funcao}
                  onChange={(ev) =>
                    set("efetivo", troca(d.efetivo, i, { ...e, funcao: ev.target.value }))
                  }
                />
                <button
                  className="rmv"
                  type="button"
                  onClick={() => set("efetivo", remove(d.efetivo, i))}
                >
                  remover
                </button>
              </div>
              <div className="step">
                <button
                  type="button"
                  aria-label="menos um"
                  onClick={() =>
                    set("efetivo", troca(d.efetivo, i, { ...e, qtd: Math.max(0, e.qtd - 1) }))
                  }
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={e.qtd}
                  onChange={(ev) =>
                    set("efetivo", troca(d.efetivo, i, { ...e, qtd: Number(ev.target.value) || 0 }))
                  }
                />
                <button
                  type="button"
                  aria-label="mais um"
                  onClick={() => set("efetivo", troca(d.efetivo, i, { ...e, qtd: e.qtd + 1 }))}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="addbar">
          {FUNCOES.map((f) => (
            <button
              key={f}
              className="btn sm"
              type="button"
              onClick={() => set("efetivo", [...d.efetivo, { funcao: f, qtd: 1 }])}
            >
              + {f}
            </button>
          ))}
          <button
            className="btn sm"
            type="button"
            onClick={() => set("efetivo", [...d.efetivo, { funcao: "", qtd: 1 }])}
          >
            + Outra função
          </button>
        </div>
        <div className="total">
          <span>Total de pessoas no dia</span>
          <b>{totalEfetivo(d.efetivo)}</b>
        </div>
      </Bloco>

      {/* 4 — serviços */}
      <Bloco n="4" titulo="Serviços executados no dia">
        <div className="rep">
          {d.servicos.map((s, i) => (
            <div className="rep-i" key={i}>
              <input
                type="text"
                placeholder="Serviço executado"
                value={s.desc}
                onChange={(e) =>
                  set("servicos", troca(d.servicos, i, { ...s, desc: e.target.value }))
                }
              />
              <div className="rep-sub">
                <input
                  type="text"
                  placeholder="Local / pavimento"
                  value={s.local}
                  onChange={(e) =>
                    set("servicos", troca(d.servicos, i, { ...s, local: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Quantidade ou %"
                  value={s.qtd}
                  onChange={(e) =>
                    set("servicos", troca(d.servicos, i, { ...s, qtd: e.target.value }))
                  }
                />
              </div>
              <button
                className="rmv"
                type="button"
                onClick={() => set("servicos", remove(d.servicos, i))}
              >
                remover
              </button>
            </div>
          ))}
        </div>
        <div className="addbar">
          <button
            className="btn sm"
            type="button"
            onClick={() =>
              set("servicos", [...d.servicos, { local: "", desc: "", qtd: "" } as ItemServico])
            }
          >
            + Serviço
          </button>
        </div>
      </Bloco>

      {/* 5 — materiais */}
      <Bloco n="5" titulo="Materiais e equipamentos recebidos">
        <div className="rep">
          {d.materiais.map((m, i) => (
            <div className="rep-i" key={i}>
              <input
                type="text"
                placeholder="Material / equipamento"
                value={m.item}
                onChange={(e) =>
                  set("materiais", troca(d.materiais, i, { ...m, item: e.target.value }))
                }
              />
              <div className="rep-sub">
                <input
                  type="text"
                  placeholder="Nota fiscal nº"
                  value={m.nf}
                  onChange={(e) =>
                    set("materiais", troca(d.materiais, i, { ...m, nf: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Quantidade"
                  value={m.qtd}
                  onChange={(e) =>
                    set("materiais", troca(d.materiais, i, { ...m, qtd: e.target.value }))
                  }
                />
              </div>
              <button
                className="rmv"
                type="button"
                onClick={() => set("materiais", remove(d.materiais, i))}
              >
                remover
              </button>
            </div>
          ))}
          {!d.materiais.length ? (
            <p className="msg" style={{ margin: 0 }}>
              Nenhum recebimento hoje.
            </p>
          ) : null}
        </div>
        <div className="addbar">
          <button
            className="btn sm"
            type="button"
            onClick={() =>
              set("materiais", [...d.materiais, { item: "", nf: "", qtd: "" } as ItemMaterial])
            }
          >
            + Recebimento
          </button>
        </div>
      </Bloco>

      {/* 6 — ocorrências */}
      <Bloco n="6" titulo="Ocorrências, orientações e pendências">
        <label className="lbl" htmlFor="oc">
          Determinações do RT, acidentes, danos, paralisações, visitas e pendências
        </label>
        <textarea
          id="oc"
          value={d.ocorrencias}
          onChange={(e) => set("ocorrencias", e.target.value)}
        />
      </Bloco>

      {/* 7 — fotos */}
      <Bloco n="7" titulo="Registro fotográfico" hint="anexo">
        {fotos.length ? (
          <div className="fotos-grid">
            {fotos.map((f) => (
              <div className="foto-item" key={f.tempId}>
                <img src={f.url} alt="" />
                {f.enviando ? <span className="foto-carregando">enviando…</span> : null}
                <button
                  type="button"
                  className="foto-rmv"
                  aria-label="remover foto"
                  onClick={() => removerFoto(f.tempId)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="foto-pickers">
          <label className="btn sm">
            Tirar foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                adicionarFotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <label className="btn sm">
            Enviar fotos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                adicionarFotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="fields" style={{ marginTop: 12 }}>
          <div className="f">
            <label htmlFor="fa">Assunto das fotos</label>
            <input
              id="fa"
              type="text"
              value={d.fotos_assunto}
              onChange={(e) => set("fotos_assunto", e.target.value)}
            />
          </div>
        </div>
      </Bloco>

      {/* 8 — assinaturas */}
      <Bloco n="8" titulo="Assinaturas" hint="desenhe com o dedo ou o mouse">
        <div className="fields">
          <div className="f f-4">
            <label>Responsável técnico</label>
            <AssinaturaPad ref={padRT} imagemInicial={assinaturasUrls.rt} />
            <div className="sig-bar">
              <input
                type="text"
                placeholder="nome impresso"
                value={d.ass_rt}
                onChange={(e) => set("ass_rt", e.target.value)}
              />
              <button type="button" className="rmv" onClick={() => padRT.current?.limpar()}>
                limpar
              </button>
            </div>
          </div>
          <div className="f f-4">
            <label>Encarregado / preposto</label>
            <AssinaturaPad ref={padEnc} imagemInicial={assinaturasUrls.enc} />
            <div className="sig-bar">
              <input
                type="text"
                placeholder="nome impresso"
                value={d.ass_enc}
                onChange={(e) => set("ass_enc", e.target.value)}
              />
              <button type="button" className="rmv" onClick={() => padEnc.current?.limpar()}>
                limpar
              </button>
            </div>
          </div>
          <div className="f f-4">
            <label>Contratante ou fiscal</label>
            <AssinaturaPad ref={padCont} imagemInicial={assinaturasUrls.cont} />
            <div className="sig-bar">
              <input
                type="text"
                placeholder="nome impresso"
                value={d.ass_cont}
                onChange={(e) => set("ass_cont", e.target.value)}
              />
              <button type="button" className="rmv" onClick={() => padCont.current?.limpar()}>
                limpar
              </button>
            </div>
          </div>
        </div>
      </Bloco>

      <div className="savebar noprint">
        <div className="savebar-in">
          <button className="btn primary" type="button" onClick={salvar} disabled={pendente}>
            {pendente ? "Salvando…" : novo ? "Salvar diário" : "Salvar alterações"}
          </button>
          <span className="grow" />
          {erro ? <span className="msg err">{erro}</span> : null}
        </div>
      </div>
    </>
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
    <div className="blk">
      <div className="blk-h">
        <span className="blk-n">{n}</span>
        <h3>{titulo}</h3>
        {hint ? <span className="hint">{hint}</span> : null}
      </div>
      <div className="blk-b">{children}</div>
    </div>
  );
}

function Segmento({ valor, aoEscolher }: { valor: string; aoEscolher: (v: string) => void }) {
  return (
    <div className="seg">
      {CLIMA_OPCOES.map((c) => (
        <button
          key={c}
          type="button"
          data-v={c}
          aria-pressed={valor === c}
          onClick={() => aoEscolher(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function troca<T>(lista: T[], i: number, item: T): T[] {
  const nova = lista.slice();
  nova[i] = item;
  return nova;
}

function remove<T>(lista: T[], i: number): T[] {
  return lista.filter((_, j) => j !== i);
}

export type { Diario, ItemEfetivo };
