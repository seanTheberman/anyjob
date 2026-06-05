import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { getPublishedBlogPosts } from "../admin/_lib/blog-posts";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">AnyJob blog</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Guides for hiring and working better</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Practical advice for clients, providers, and businesses using AnyJob.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {posts.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {post.coverImageUrl ? (
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <Image src={post.coverImageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                  </div>
                ) : null}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>{post.category}</span>
                    <span>·</span>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-950">{post.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt || post.content.slice(0, 180)}</p>
                  <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
                    Read article <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-950">No articles published yet</h2>
            <p className="mt-1 text-sm text-slate-600">Published admin posts will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
