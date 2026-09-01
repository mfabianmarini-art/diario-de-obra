import FormAuth from "./FormAuth";

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;
  return <FormAuth modo={modo === "cadastro" ? "cadastro" : "login"} />;
}
