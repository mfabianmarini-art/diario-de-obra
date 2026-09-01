"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cadastrar, entrar, type EstadoAuth } from "./actions";

const INICIAL: EstadoAuth = {};

export default function FormAuth({ modo }: { modo: "login" | "cadastro" }) {
  const acao = modo === "cadastro" ? cadastrar : entrar;
  const [estado, enviar, pendente] = useActionState(acao, INICIAL);

  return (
    <div className="auth">
      <span className="mark">
        CAPE<small>Consultoria, Avaliações e Perícias de Engenharia</small>
      </span>

      <h2>{modo === "cadastro" ? "Criar conta" : "Diário de obra"}</h2>
      <p className="sub">
        {modo === "cadastro"
          ? "A conta dá acesso às obras em que você for incluído."
          : "Entre para lançar e consultar os diários das suas obras."}
      </p>

      {estado.erro ? <p className="aviso">{estado.erro}</p> : null}
      {estado.aviso ? <p className="aviso ok">{estado.aviso}</p> : null}

      <form action={enviar}>
        {modo === "cadastro" ? (
          <div className="f">
            <label htmlFor="nome">Nome</label>
            <input id="nome" name="nome" type="text" autoComplete="name" />
          </div>
        ) : null}

        <div className="f">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="f">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
            required
          />
        </div>

        <button className="btn primary" type="submit" disabled={pendente}>
          {pendente ? "Aguarde…" : modo === "cadastro" ? "Criar conta" : "Entrar"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14 }}>
        {modo === "cadastro" ? (
          <Link href="/login">Já tenho conta</Link>
        ) : (
          <Link href="/login?modo=cadastro">Criar uma conta</Link>
        )}
      </p>
    </div>
  );
}
