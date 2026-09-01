# Diário de Obra — CAPE

Aplicativo web para preenchimento do **diário de obra simplificado (Modelo A)** em campo,
pelo celular ou pelo computador, com histórico por obra e folha pronta para impressão em PDF
no layout da CAPE Engenharia.

Construído sobre a Resolução CONFEA nº 1.024/2009 (Livro de Ordem): o formulário cobre os
registros que o art. 4º, §1º exige — identificação da obra, do responsável técnico e da ART,
orientações técnicas, ocorrências, acidentes, interrupções e seus motivos — datados e assinados.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Supabase (Postgres + Auth) · deploy na Vercel.

---

## O que o app faz

- **Obras** — cadastro único do cabeçalho (obra, endereço, contratante, executante, RT, CREA, ART, prazo).
- **Equipe por obra** — o gestor inclui funcionários pelo e-mail; cada um lança na obra em que foi incluído.
- **Diário do dia** — clima por período, horas paradas, efetivo por função com contador, serviços,
  materiais recebidos, ocorrências, registro fotográfico e assinaturas.
- **Preenchimento rápido** — data de hoje, numeração da folha e efetivo do último dia vêm pré-preenchidos.
- **Folha para impressão** — layout CAPE, sempre em fundo branco, mesmo se o aparelho estiver no tema escuro.
- **Um diário por obra por dia** — restrição no banco, para o histórico não duplicar.

---

## 1. Criar o projeto no Supabase

1. Entre em [supabase.com](https://supabase.com) e crie um projeto (a região `South America (São Paulo)` dá menos latência no Brasil).
2. Abra **SQL Editor → New query**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e execute.
   Isso cria as tabelas `perfis`, `obras`, `obra_membros` e `diarios`, as políticas de RLS
   e as funções `criar_obra` e `adicionar_membro`.
3. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Em **Authentication → Providers → Email**, deixe `Email` habilitado.
   Para simplificar o cadastro dos funcionários, desligue `Confirm email`
   (senão cada um precisa confirmar o e-mail antes do primeiro acesso).

> As duas chaves acima são públicas por natureza — quem protege os dados é a RLS, não a chave.
> Nunca coloque a `service_role` no projeto.

## 2. Rodar localmente

```bash
npm install
cp .env.example .env.local     # preencha com as duas chaves do passo 1
npm run dev                    # http://localhost:3000
```

## 3. Subir para o GitHub

```bash
git init
git add .
git commit -m "Diário de obra CAPE — versão inicial"
git branch -M main
git remote add origin git@github.com:SEU-USUARIO/diario-obra-cape.git
git push -u origin main
```

## 4. Publicar na Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
2. Framework: **Next.js** (detectado sozinho). Build e output: deixe o padrão.
3. Em **Environment Variables**, adicione as duas variáveis do passo 1
   (marque Production, Preview e Development).
4. **Deploy**. Cada `git push` na `main` publica sozinho.
5. Depois do primeiro deploy, volte ao Supabase em **Authentication → URL Configuration**
   e coloque o domínio da Vercel em `Site URL` e em `Redirect URLs`.

---

## Primeiro uso

1. Acesse o app publicado e clique em **Criar uma conta** — a primeira conta é a sua.
2. Vá em **Obras**, cadastre a obra e preencha o cabeçalho.
3. Peça ao funcionário para criar a conta dele no mesmo endereço.
4. Na página da obra, no bloco **Quem lança nesta obra**, adicione o e-mail dele como `Campo`.
5. No celular, abra o app e use "Adicionar à tela de início" — ele abre em tela cheia, como aplicativo.

### Papéis

| Papel | Pode |
|---|---|
| `gestor` | editar a obra, incluir e remover pessoas, excluir a obra e qualquer diário |
| `campo`  | lançar, editar e imprimir os diários da obra; excluir apenas os que lançou |

Quem cria a obra vira `gestor` dela automaticamente.

---

## Estrutura

```
src/
├─ app/
│  ├─ page.tsx                    histórico de diários, com filtro por obra
│  ├─ login/                      entrar e criar conta (server actions)
│  ├─ obras/                      lista, cadastro, cabeçalho e equipe da obra
│  └─ diarios/
│     ├─ novo/                    novo diário, já pré-preenchido
│     ├─ [id]/                    folha pronta para impressão
│     └─ [id]/editar/             edição do dia
├─ components/
│  ├─ DiarioForm.tsx              formulário do dia (client component)
│  ├─ Folha.tsx                   a folha impressa, layout CAPE
│  └─ TopBar.tsx
├─ lib/
│  ├─ tipos.ts                    tipos e utilidades de data/efetivo/clima
│  └─ supabase/                   clientes de servidor e de navegador
└─ middleware.ts                  renova a sessão e protege as rotas
supabase/schema.sql               tabelas, RLS e funções — cole no SQL Editor
```

## Identidade visual

Carmim `#b81105`, tipografia IBM Plex Sans / IBM Plex Sans Condensed / JetBrains Mono,
tokens de cor em `src/app/globals.css`, com tema claro e escuro e paleta clara forçada na impressão.

## Próximos passos naturais

- Fotos anexadas ao dia (Supabase Storage) saindo como prancha no PDF.
- Funcionamento offline no canteiro (service worker + fila de sincronização).
- Modelo B — RDO completo, para obra com contrato, medição e fiscalização.
- Exportação do mês em CSV para consolidar efetivo, horas paradas e serviços.

---

CAPE — Consultoria, Avaliações e Perícias de Engenharia
