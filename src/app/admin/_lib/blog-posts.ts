import "server-only";

import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  authorName: string;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  category: string | null;
  author_name: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function rowToPost(row: BlogRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content || "",
    coverImageUrl: row.cover_image_url || "",
    category: row.category || "Guides",
    authorName: row.author_name || "AnyJob Team",
    status: row.status === "published" ? "published" : "draft",
    publishedAt: row.published_at,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

const selectColumns = "id,title,slug,excerpt,content,cover_image_url,category,author_name,status,published_at,created_at,updated_at";

export async function getAdminBlogPosts() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await (supabase as never as {
    from: (table: string) => {
      select: (columns: string) => {
        order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: BlogRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("blog_posts").select(selectColumns).order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToPost);
}

export async function getPublishedBlogPosts() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await (supabase as never as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: BlogRow[] | null; error: { message: string } | null }>;
        };
      };
    };
  }).from("blog_posts").select(selectColumns).eq("status", "published").order("published_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToPost);
}

export async function getPublishedBlogPost(slug: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await (supabase as never as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: BlogRow | null; error: { message: string } | null }>;
        };
      };
    };
  }).from("blog_posts").select(selectColumns).eq("slug", slug).single();

  if (error || !data || data.status !== "published") return null;
  return rowToPost(data);
}

export async function createBlogPost(formData: FormData) {
  "use server";

  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const slug = slugify(String(formData.get("slug") || title)) || `post-${Date.now()}`;
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";
  const supabase = createAdminSupabaseClient();

  await (supabase as never as {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  }).from("blog_posts").insert({
    title,
    slug,
    excerpt: String(formData.get("excerpt") || "").trim(),
    content: String(formData.get("content") || "").trim(),
    cover_image_url: String(formData.get("cover_image_url") || "").trim() || null,
    category: String(formData.get("category") || "Guides").trim() || "Guides",
    author_name: String(formData.get("author_name") || "AnyJob Team").trim() || "AnyJob Team",
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  });

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

export async function setBlogPostStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";
  if (!id) return;

  const supabase = createAdminSupabaseClient();
  await (supabase as never as {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  }).from("blog_posts").update({
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  }).eq("id", id);

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}
