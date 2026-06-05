import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getPublishedBlogPost } from "../../admin/_lib/blog-posts";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  if (!post) notFound();

  const paragraphs = post.content.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  return (
    <main className="min-h-screen bg-white">
      <article>
        <header className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
              <ArrowLeft className="h-4 w-4" />
              Blog
            </Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">{post.category} · {formatDate(post.publishedAt)}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{post.title}</h1>
            {post.excerpt ? <p className="mt-4 text-lg leading-8 text-slate-600">{post.excerpt}</p> : null}
          </div>
        </header>

        {post.coverImageUrl ? (
          <div className="relative mx-auto mt-8 aspect-[16/7] max-w-5xl overflow-hidden rounded-lg bg-slate-100">
            <Image src={post.coverImageUrl} alt="" fill sizes="100vw" className="object-cover" priority />
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-6 text-base leading-8 text-slate-700">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
