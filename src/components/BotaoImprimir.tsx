"use client";

export default function BotaoImprimir() {
  return (
    <button className="btn primary" type="button" onClick={() => window.print()}>
      Imprimir / salvar PDF
    </button>
  );
}
