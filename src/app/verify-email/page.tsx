import VerifyEmailClient from "./VerifyEmailClient";

type VerifyEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = (await searchParams) || {};
  const email = Array.isArray(params.email) ? params.email[0] || "" : params.email || "";
  const token = Array.isArray(params.token) ? params.token[0] || "" : params.token || "";

  return <VerifyEmailClient email={email} token={token} />;
}
