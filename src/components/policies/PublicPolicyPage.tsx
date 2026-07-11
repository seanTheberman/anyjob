import Link from "next/link";

import type { CmsPolicyDocument } from "@/lib/cms/policy-definitions";
import { POLICY_DOCUMENTS } from "@/lib/cms/policy-definitions";

function renderPolicyBody(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="text-base leading-8 text-slate-600">
        {paragraph}
      </p>
    ));
}

export function PublicPolicyPage({ document }: { document: CmsPolicyDocument }) {
  return (
    <div className="bg-slate-50 pt-24">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-red-600">AnyJob policies</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{document.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{document.description}</p>
          <p className="mt-4 text-sm font-medium text-slate-500">{document.updatedLabel}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Policy pages</p>
            <nav className="mt-3 space-y-1">
              {POLICY_DOCUMENTS.map((policy) => (
                <Link
                  key={policy.slug}
                  href={policy.path}
                  className={[
                    "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    policy.slug === document.slug
                      ? "bg-red-50 text-red-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")}
                >
                  {policy.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-4">
          {document.blocks.map((block) => (
            <article key={block.key} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">{block.title}</h2>
              <div className="mt-4 space-y-4">{renderPolicyBody(block.body)}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
