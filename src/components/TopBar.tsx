import Link from "next/link";
import { sair } from "@/app/login/actions";

export default function TopBar({ email, voltar }: { email?: string | null; voltar?: string }) {
  return (
    <div className="top noprint">
      <div className="top-in">
        {voltar ? (
          <Link className="btn ghost sm" href={voltar}>
            ← Voltar
          </Link>
        ) : (
          <Link className="mark" href="/">
            CAPE<small>Engenharia</small>
          </Link>
        )}
        <h1>Diário de Obra</h1>
        <span className="grow" />
        {email ? <span className="quem">{email}</span> : null}
        <form action={sair}>
          <button className="btn ghost sm" type="submit">
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
