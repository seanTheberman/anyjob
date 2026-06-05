import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AdminActionButton } from "./AdminActionButton";

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone?: string;
}

export function StatCard({ label, value, delta, detail, tone = "text-emerald-700" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={cn("rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold", tone)}>{delta}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

interface AdminTableProps {
  columns: string[];
  rows: string[][];
  actionLabel?: string;
}

export function AdminTable({ columns, rows, actionLabel = "Action" }: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {column}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                {actionLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={`${row.join("-")}-${rowIndex}`} className="hover:bg-slate-50">
                {row.slice(0, -1).map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-4 text-sm text-slate-700">
                    {index === row.length - 2 ? <StatusBadge value={cell} /> : cell}
                  </td>
                ))}
                <td className="px-4 py-4 text-right">
                  <AdminActionButton label={row[row.length - 1]} context={row[0] || "selected row"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const className = lower.includes("pending") || lower.includes("held") || lower.includes("watch")
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : lower.includes("dispute") || lower.includes("urgent") || lower.includes("high")
      ? "border-red-200 bg-red-50 text-red-800"
      : lower.includes("verified") || lower.includes("active") || lower.includes("paid") || lower.includes("completed") || lower.includes("enabled") || lower.includes("strong")
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return <Badge variant="outline" className={className}>{value}</Badge>;
}

export function Toolbar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <input className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="Search this view" />
        <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100">
          <option>All statuses</option>
          <option>Needs review</option>
          <option>Active</option>
          <option>Blocked</option>
        </select>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function AdminButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}
