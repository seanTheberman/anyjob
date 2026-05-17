"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckSquare, Mail, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
import { StatusBadge } from "./AdminPrimitives";
import type { AdminProvider, AdminUser, KycReview } from "./admin-data";

type FilterOption = "all" | string;

function includesQuery(values: unknown[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => String(value).toLowerCase().includes(normalized));
}

function BulkBar({
  selectedCount,
  children,
  onClear,
}: {
  selectedCount: number;
  children: React.ReactNode;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-red-900">{selectedCount} selected</span>
      <div className="flex flex-nowrap gap-2 overflow-x-auto">
        {children}
        <button onClick={onClear} className="h-8 rounded-lg border border-red-200 bg-white px-3 font-medium text-red-700 hover:bg-red-100">
          Clear
        </button>
      </div>
    </div>
  );
}

export function UsersWorklist({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterOption>("all");
  const [risk, setRisk] = useState<FilterOption>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const statusMatch = status === "all" || user.status === status;
      const riskMatch = risk === "all" || user.risk === risk;
      return statusMatch && riskMatch && includesQuery(Object.values(user), query);
    });
  }, [query, risk, status, users]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((user) => selected.has(user.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        filtered.forEach((user) => next.delete(user.id));
      } else {
        filtered.forEach((user) => next.add(user.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[1fr_180px_160px_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="Search name, email, city, ID" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Watchlisted">Watchlisted</option>
            <option value="Pending email">Pending email</option>
            <option value="VIP">VIP</option>
            <option value="Blocked">Blocked</option>
          </select>
          <select value={risk} onChange={(event) => setRisk(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All risk</option>
            <option value="Low">Low risk</option>
            <option value="Medium">Medium risk</option>
            <option value="High">High risk</option>
          </select>
          <button onClick={() => { setQuery(""); setStatus("all"); setRisk("all"); }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Reset
          </button>
        </div>
      </div>

      <BulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
          <Mail className="h-4 w-4" /> Message
        </button>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
          <ShieldAlert className="h-4 w-4" /> Watchlist
        </button>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
          <UserX className="h-4 w-4" /> Block
        </button>
      </BulkBar>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input aria-label="Select all users" type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
                </th>
                {["User", "City", "Bookings", "Spend", "Risk", "Status", "Last seen", "Action"].map((column) => (
                  <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4"><input aria-label={`Select ${user.name}`} type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} /></td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-slate-950">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{user.city}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{user.bookings}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{user.spend}</td>
                  <td className="px-4 py-4"><StatusBadge value={user.risk} /></td>
                  <td className="px-4 py-4"><StatusBadge value={user.status} /></td>
                  <td className="px-4 py-4 text-sm text-slate-700">{user.lastSeen}</td>
                  <td className="px-4 py-4"><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{filtered.length} users shown</div>
      </div>
    </>
  );
}

export function ProvidersWorklist({ providers }: { providers: AdminProvider[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kyc, setKyc] = useState<FilterOption>("all");
  const [service, setService] = useState<FilterOption>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const services = Array.from(new Set(providers.map((provider) => provider.service)));
  const filtered = useMemo(() => {
    return providers.filter((provider) => {
      const kycMatch = kyc === "all" || provider.kycStatus === kyc;
      const serviceMatch = service === "all" || provider.service === service;
      return kycMatch && serviceMatch && includesQuery(Object.values(provider), query);
    });
  }, [kyc, providers, query, service]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((provider) => selected.has(provider.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) filtered.forEach((provider) => next.delete(provider.id));
      else filtered.forEach((provider) => next.add(provider.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function eligibleProviderIds(providerIds: string[], action: "approve" | "request_docs" | "reject") {
    if (action === "request_docs") {
      return providers.filter((provider) => providerIds.includes(provider.id) && provider.docsSubmitted).map((provider) => provider.id);
    }
    return providers.filter((provider) => providerIds.includes(provider.id) && provider.docsSubmitted).map((provider) => provider.id);
  }

  async function runKycAction(action: "approve" | "request_docs" | "reject", providerIds = Array.from(selected)) {
    providerIds = eligibleProviderIds(providerIds, action);
    if (!providerIds.length) return;
    setPendingAction(action);
    setMessage(null);

    const response = await fetch("/api/admin/providers/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, providerIds }),
    });
    const payload = await response.json().catch(() => ({}));
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error || "KYC update failed");
      return;
    }

    setSelected(new Set());
    setMessage(`Updated ${providerIds.length} provider${providerIds.length === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[1fr_190px_170px_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="Search provider, service, city, document" />
          <select value={kyc} onChange={(event) => setKyc(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All KYC statuses</option>
            <option value="Approved">Approved</option>
            <option value="Needs review">Needs review</option>
            <option value="Missing document">Missing document</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={service} onChange={(event) => setService(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All services</option>
            {services.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button onClick={() => { setQuery(""); setKyc("all"); setService("all"); }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Reset
          </button>
        </div>
      </div>

      <BulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("approve")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <ShieldCheck className="h-4 w-4" /> Approve KYC
        </button>
        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("request_docs")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <Mail className="h-4 w-4" /> Request docs
        </button>
        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("approve")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <CheckSquare className="h-4 w-4" /> Remove limit
        </button>
      </BulkBar>
      {message ? <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input aria-label="Select all providers" type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
                </th>
                {["Provider", "Service", "City", "KYC", "Docs submitted", "Documents", "Rating", "Jobs", "Account", "Action"].map((column) => (
                  <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4"><input aria-label={`Select ${provider.name}`} type="checkbox" checked={selected.has(provider.id)} onChange={() => toggleOne(provider.id)} /></td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-slate-950">{provider.name}</p>
                    <p className="text-xs text-slate-500">{provider.id}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{provider.service}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{provider.city}</td>
                  <td className="px-4 py-4"><StatusBadge value={provider.kycStatus} /></td>
                  <td className="px-4 py-4"><StatusBadge value={provider.docsSubmitted ? "Submitted" : "Not submitted"} /></td>
                  <td className="px-4 py-4 text-sm text-slate-700">{provider.documents}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{provider.rating}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{provider.jobs}</td>
                  <td className="px-4 py-4"><StatusBadge value={provider.accountStatus} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                      {provider.docsSubmitted ? (
                        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("approve", [provider.id])} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">Approve</button>
                      ) : null}
                      <button disabled={Boolean(pendingAction) || !provider.docsSubmitted} onClick={() => runKycAction("request_docs", [provider.id])} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100">Docs</button>
                      {provider.docsSubmitted ? (
                        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("reject", [provider.id])} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">Reject</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{filtered.length} providers shown</div>
      </div>
    </>
  );
}

export function KycWorklist({ reviews }: { reviews: KycReview[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterOption>("all");
  const [priority, setPriority] = useState<FilterOption>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      const statusMatch = status === "all" || review.status === status;
      const priorityMatch = priority === "all" || review.priority === priority;
      return statusMatch && priorityMatch && includesQuery(Object.values(review), query);
    });
  }, [priority, query, reviews, status]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((review) => selected.has(review.id));

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) filtered.forEach((review) => next.delete(review.id));
      else filtered.forEach((review) => next.add(review.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function providerIdsFor(reviewIds: string[]) {
    return reviews.filter((review) => reviewIds.includes(review.id)).map((review) => review.providerId);
  }

  function eligibleReviewIds(reviewIds: string[], action: "approve" | "request_docs" | "reject") {
    if (action === "request_docs") {
      return reviews.filter((review) => reviewIds.includes(review.id) && review.docsSubmitted).map((review) => review.id);
    }
    return reviews.filter((review) => reviewIds.includes(review.id) && review.docsSubmitted).map((review) => review.id);
  }

  async function runKycAction(action: "approve" | "request_docs" | "reject", reviewIds = Array.from(selected)) {
    reviewIds = eligibleReviewIds(reviewIds, action);
    const providerIds = providerIdsFor(reviewIds);
    if (!providerIds.length) return;
    setPendingAction(action);
    setMessage(null);

    const response = await fetch("/api/admin/providers/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, providerIds }),
    });
    const payload = await response.json().catch(() => ({}));
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error || "KYC update failed");
      return;
    }

    setSelected(new Set());
    setMessage(`Updated ${providerIds.length} provider${providerIds.length === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[1fr_190px_170px_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="Search provider, issue, document" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All KYC statuses</option>
            <option value="Needs review">Needs review</option>
            <option value="Missing document">Missing document</option>
            <option value="Rejected">Rejected</option>
            <option value="Approved">Approved</option>
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button onClick={() => { setQuery(""); setStatus("all"); setPriority("all"); }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Reset
          </button>
        </div>
      </div>

      <BulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("approve")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <ShieldCheck className="h-4 w-4" /> Approve
        </button>
        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("request_docs")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <Mail className="h-4 w-4" /> Request docs
        </button>
        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("reject")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <ShieldAlert className="h-4 w-4" /> Reject
        </button>
      </BulkBar>
      {message ? <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input aria-label="Select all KYC reviews" type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
                </th>
                {["Provider", "Issue", "Document", "Docs submitted", "Priority", "Status", "Submitted", "Account impact", "Action"].map((column) => (
                  <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4"><input aria-label={`Select ${review.provider} KYC review`} type="checkbox" checked={selected.has(review.id)} onChange={() => toggleOne(review.id)} /></td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-slate-950">{review.provider}</p>
                    <p className="text-xs text-slate-500">{review.id}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{review.issue}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{review.document}</td>
                  <td className="px-4 py-4"><StatusBadge value={review.docsSubmitted ? "Submitted" : "Not submitted"} /></td>
                  <td className="px-4 py-4"><StatusBadge value={review.priority} /></td>
                  <td className="px-4 py-4"><StatusBadge value={review.status} /></td>
                  <td className="px-4 py-4 text-sm text-slate-700">{review.submitted}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{review.accountImpact}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                      {review.docsSubmitted ? (
                        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("approve", [review.id])} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">Approve</button>
                      ) : null}
                      <button disabled={Boolean(pendingAction) || !review.docsSubmitted} onClick={() => runKycAction("request_docs", [review.id])} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100">Docs</button>
                      {review.docsSubmitted ? (
                        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("reject", [review.id])} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">Reject</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{filtered.length} KYC reviews shown</div>
      </div>
    </>
  );
}
