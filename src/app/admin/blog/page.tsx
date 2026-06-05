import Link from "next/link";
import { BookOpen, Eye, Send } from "lucide-react";

import { AdminShell } from "../_components/AdminShell";
import { StatusBadge } from "../_components/AdminPrimitives";
import { createBlogPost, getAdminBlogPosts, setBlogPostStatus } from "../_lib/blog-posts";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();
  const published = posts.filter((post) => post.status === "published").length;

  return (
    <AdminShell
      title="Blog"
      description="Create, publish, and manage public AnyJob blog posts from Supabase."
      actions={
        <Link href="/blog" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800">
          <BookOpen className="h-4 w-4" />
          View blog
        </Link>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total posts</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{posts.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{published}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Drafts</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{posts.length - published}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <form action={createBlogPost} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Create post</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input name="title" required className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="How to choose a reliable provider" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Slug</span>
              <input name="slug" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="how-to-choose-a-provider" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <input name="category" defaultValue="Guides" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select name="status" defaultValue="draft" className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Cover image URL</span>
              <input name="cover_image_url" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Excerpt</span>
              <textarea name="excerpt" className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Content</span>
              <textarea name="content" required className="mt-2 min-h-44 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="Write the article body. Blank lines become paragraphs on the public page." />
            </label>
            <input type="hidden" name="author_name" value="AnyJob Team" />
            <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
              <Send className="h-4 w-4" />
              Save post
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {posts.length ? posts.map((post) => (
            <article key={post.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">{post.title}</h2>
                    <StatusBadge value={post.status} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{post.category}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">/{post.slug} · {formatDate(post.publishedAt)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt || post.content.slice(0, 140)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {post.status === "published" ? (
                    <Link href={`/blog/${post.slug}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <Eye className="h-4 w-4" />
                      Open
                    </Link>
                  ) : null}
                  <form action={setBlogPostStatus}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="status" value={post.status === "published" ? "draft" : "published"} />
                    <button type="submit" className="h-9 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800">
                      {post.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          )) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 text-lg font-semibold text-slate-950">No blog posts yet</h2>
              <p className="mt-1 text-sm text-slate-600">Create the first article to publish it on the public blog.</p>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
