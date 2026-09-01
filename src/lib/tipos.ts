export type Papel = "gestor" | "campo";

export type Obra = {
  id: string;
  nome: string;
  endereco: string | null;
  contratante: string | null;
  executante: string | null;
  rt: string | null;
  crea: string | null;
  art: string | null;
  inicio: string | null;
  prazo: string | null;
};

export type Clima = { manha: string; tarde: string; horasParadas: string; obs: string };
export type ItemEfetivo = { funcao: string; qtd: number };
export type ItemServico = { local: string; desc: string; qtd: string };
export type ItemMaterial = { item: string; nf: string; qtd: string };

export type Diario = {
  id: string;
  obra_id: string;
  data: string;
  folha: string;
  clima: Clima;
  efetivo: ItemEfetivo[];
  servicos: ItemServico[];
  materiais: ItemMaterial[];
  ocorrencias: string;
  fotos_qtd: string;
  fotos_assunto: string;
  ass_rt: string;
  ass_enc: string;
  ass_cont: string;
  autor_id: string;
  criado_em: string;
};

export const FUNCOES = [
  "Encarregado", "Pedreiro", "Servente", "Carpinteiro", "Armador",
  "Eletricista", "Encanador", "Pintor", "Azulejista", "Gesseiro",
];

export const CLIMA_OPCOES = ["Bom", "Nublado", "Chuva", "Impraticável"];

const DIAS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

export function hoje(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function dataBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function diaDaSemana(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return DIAS[new Date(a, m - 1, d).getDay()];
}

export function totalEfetivo(efetivo: ItemEfetivo[] | null | undefined): number {
  return (efetivo || []).reduce((t, e) => t + (Number(e.qtd) || 0), 0);
}

export function praticabilidade(c: Clima | null | undefined): string {
  if (!c) return "Praticável";
  const impM = c.manha === "Impraticável";
  const impT = c.tarde === "Impraticável";
  if (impM && impT) return "Dia impraticável";
  if (impM || impT) return "Parcialmente impraticável";
  if (Number(c.horasParadas) > 0) return "Parcialmente praticável";
  return "Praticável";
}
