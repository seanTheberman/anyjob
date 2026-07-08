import ResetPasswordClient from "./ResetPasswordClient";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) || {};
  const email = Array.isArray(params.email) ? params.email[0] || "" : params.email || "";
  const token = Array.isArray(params.token) ? params.token[0] || "" : params.token || "";

  return <ResetPasswordClient email={email} token={token} />;
}
