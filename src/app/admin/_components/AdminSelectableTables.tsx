"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, ChevronDown, ChevronUp, CreditCard, Mail, ShieldAlert, ShieldCheck, Star, UserRound, UserX } from "lucide-react";
import { StatusBadge } from "./AdminPrimitives";
import type { AdminBusiness, AdminProvider, AdminUser, KycReview } from "./admin-data";

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

function TruncatedCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const title = typeof children === "string" ? children : undefined;

  return (
    <td className={`px-3 py-4 text-sm text-slate-700 ${className}`}>
      <div title={title} className="truncate">
        {children}
      </div>
    </td>
  );
}

type UserDetails = {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    city: string;
    postalCode: string;
    bio: string;
    joined: string;
    updated: string;
  };
  verification: {
    profileExists: boolean;
    buyerProfileExists: boolean;
    emailVerified: string;
    platformKyc: string;
    stripeCustomerOrAccount: string;
  };
  commercial: {
    totalSpent: string;
    bookings: number;
    paidBookings: number;
    completedBookings: number;
    openRequests: number;
    averageGivenRating: string;
    preferredServices: string[];
  };
  risk: {
    status: string;
    riskOverride: string;
    note: string;
    updated: string;
  };
  recentJobs: Array<{ id: string; service: string; description: string; status: string; city: string; budget: string; posted: string }>;
  recentPayments: Array<{ id: string; amount: string; status: string; paid: string; city: string; date: string }>;
  recentReviews: Array<{ id: string; rating: string; comment: string; date: string }>;
  support: {
    conversations: number;
    activeConversations: number;
    unreadNotifications: number;
    latestNotification: string;
  };
};

type ProviderDetails = {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    serviceCategory: string;
    experience: string;
    hourlyRate: string;
    description: string;
    joined: string;
    updated: string;
  };
  verification: {
    sellerRow: boolean;
    profileRow: boolean;
    status: string;
    profileVerified: string;
    emailVerified: string;
    phoneVerified: string;
    idDocument: string;
    selfieVideo: string;
    insurance: string;
    backgroundCheck: string;
    siret: string;
  };
  commercial: {
    totalEarnings: string;
    bookings: number;
    listedJobs: number;
    completedBookings: number;
    paidBookings: number;
    bids: number;
    acceptedBids: number;
    activeServices: number;
    averageRating: string;
    reviewCount: number;
    badges: number;
  };
  services: Array<{ id: string; title: string; description: string; rate: string; meta: string; status: string }>;
  recentBookings: Array<{ id: string; primary: string; secondary: string; meta: string; status: string }>;
  recentBids: Array<{ id: string; primary: string; secondary: string; meta: string; status: string }>;
  recentReviews: Array<{ id: string; primary: string; secondary: string; meta: string }>;
  support: {
    conversations: number;
    activeConversations: number;
    latestConversation: string;
  };
  badges: Array<{ id: string; primary: string; secondary: string; meta: string }>;
};

type BusinessDetails = {
  profile: {
    id: string;
    ownerUserId: string;
    name: string;
    legalName: string;
    registrationNumber: string;
    businessType: string;
    industry: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    joined: string;
    updated: string;
    lastActivity: string;
  };
  owner: {
    name: string;
    email: string;
    phone: string;
    profileRow: boolean;
    userProfileRow: boolean;
    role: string;
    updated: string;
  };
  verification: {
    status: string;
    verified: string;
    reviewedAt: string;
    rejectionReason: string;
    registration: string;
    documentCount: number;
    missingRequiredDocuments: number;
    documentSource: string;
  };
  commercial: {
    hires: number;
    jobs: number;
    activeJobs: number;
    activeShifts: number;
    applications: number;
    activePayments: number;
    paidPayments: number;
    releasedPayments: number;
    totalPaid: string;
    totalHeld: string;
  };
  workSetup: {
    workTypes: string[];
    roles: string[];
  };
  documents: Array<{ id: string; primary: string; secondary: string; meta: string; status?: string }>;
  recentPosts: Array<{ id: string; primary: string; secondary: string; meta: string; status?: string }>;
  recentApplications: Array<{ id: string; primary: string; secondary: string; meta: string; status?: string }>;
  recentPayments: Array<{ id: string; primary: string; secondary: string; meta: string; status?: string }>;
  support: {
    conversations: number;
    activeConversations: number;
    unreadNotifications: number;
    latestNotification: string;
    latestConversation: string;
  };
};

function DetailMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; primary: string; secondary: string; meta: string; status?: string }>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length ? items.map((item) => (
          <div key={`${title}-${item.id}`} className="min-w-0 rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-900">{item.primary}</p>
              {item.status ? <StatusBadge value={item.status} /> : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.secondary}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{item.meta}</p>
          </div>
        )) : (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function UserDetailsPanel({ details }: { details: UserDetails }) {
  return (
    <div className="space-y-4 rounded-lg border border-red-100 bg-red-50/30 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label="Total spent" value={details.commercial.totalSpent} icon={CreditCard} />
        <DetailMetric label="Bookings" value={details.commercial.bookings} icon={BriefcaseBusiness} />
        <DetailMetric label="Open requests" value={details.commercial.openRequests} icon={ShieldAlert} />
        <DetailMetric label="Avg rating given" value={details.commercial.averageGivenRating} icon={Star} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Buyer profile</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Phone:</span> {details.profile.phone}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Role:</span> {details.profile.role}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Location:</span> {details.profile.city} · {details.profile.postalCode}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Joined:</span> {details.profile.joined}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Profile row:</span> {details.verification.profileExists ? "Added" : "Not added"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Buyer row:</span> {details.verification.buyerProfileExists ? "Added" : "Not added"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Email:</span> {details.verification.emailVerified}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">KYC:</span> {details.verification.platformKyc}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Payment profile:</span> {details.verification.stripeCustomerOrAccount}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Updated:</span> {details.profile.updated}</p>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{details.profile.bio}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Risk and service signals</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Admin status:</span> {details.risk.status}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Risk override:</span> {details.risk.riskOverride}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Paid bookings:</span> {details.commercial.paidBookings}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Completed:</span> {details.commercial.completedBookings}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Support threads:</span> {details.support.conversations}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Unread notices:</span> {details.support.unreadNotifications}</p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred services</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {details.commercial.preferredServices.map((service) => <StatusBadge key={service} value={service} />)}
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{details.risk.note}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DetailList
          title="Recent job posts"
          empty="No buyer job posts found."
          items={details.recentJobs.map((job) => ({
            id: job.id,
            primary: job.service,
            secondary: job.description,
            meta: `${job.city} · ${job.budget} · ${job.posted}`,
            status: job.status,
          }))}
        />
        <DetailList
          title="Recent payments"
          empty="No booking payments found."
          items={details.recentPayments.map((payment) => ({
            id: payment.id,
            primary: `${payment.amount} · ${payment.paid}`,
            secondary: `${payment.city} booking`,
            meta: payment.date,
            status: payment.status,
          }))}
        />
        <DetailList
          title="Recent reviews given"
          empty="No reviews given yet."
          items={details.recentReviews.map((review) => ({
            id: review.id,
            primary: `${review.rating} star rating`,
            secondary: review.comment,
            meta: review.date,
          }))}
        />
      </div>
    </div>
  );
}

function ProviderDetailsPanel({ details }: { details: ProviderDetails }) {
  return (
    <div className="space-y-4 rounded-lg border border-red-100 bg-red-50/30 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label="Total earnings" value={details.commercial.totalEarnings} icon={CreditCard} />
        <DetailMetric label="Bookings" value={details.commercial.bookings} icon={BriefcaseBusiness} />
        <DetailMetric label="Bids" value={`${details.commercial.acceptedBids}/${details.commercial.bids} accepted`} icon={ShieldCheck} />
        <DetailMetric label="Rating" value={details.commercial.averageRating} icon={Star} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Provider profile</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Email:</span> {details.profile.email}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Phone:</span> {details.profile.phone}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Location:</span> {details.profile.city} · {details.profile.country}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Category:</span> {details.profile.serviceCategory}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Experience:</span> {details.profile.experience}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Hourly rate:</span> {details.profile.hourlyRate}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Joined:</span> {details.profile.joined}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Updated:</span> {details.profile.updated}</p>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{details.profile.description}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">KYC and trust</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Seller row:</span> {details.verification.sellerRow ? "Added" : "Not added"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Profile row:</span> {details.verification.profileRow ? "Added" : "Not added"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Status:</span> {details.verification.status}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Profile KYC:</span> {details.verification.profileVerified}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Email:</span> {details.verification.emailVerified}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Phone:</span> {details.verification.phoneVerified}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">ID:</span> {details.verification.idDocument}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Selfie video:</span> {details.verification.selfieVideo}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Insurance:</span> {details.verification.insurance}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Background:</span> {details.verification.backgroundCheck}</p>
            <p className="text-sm text-slate-600 sm:col-span-2"><span className="font-medium text-slate-900">SIRET:</span> {details.verification.siret}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DetailList
          title="Services listed"
          empty="No provider services found."
          items={details.services.map((service) => ({
            id: service.id,
            primary: `${service.title} · ${service.rate}`,
            secondary: service.description,
            meta: service.meta,
            status: service.status,
          }))}
        />
        <DetailList title="Recent bookings" empty="No provider bookings found." items={details.recentBookings} />
        <DetailList title="Recent bids" empty="No provider bids found." items={details.recentBids} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DetailList title="Recent reviews received" empty="No reviews received yet." items={details.recentReviews} />
        <DetailList title="Badges awarded" empty="No badges awarded yet." items={details.badges} />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Support and operations</h3>
          <div className="mt-3 grid gap-3">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Support threads:</span> {details.support.conversations}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Active threads:</span> {details.support.activeConversations}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Latest conversation:</span> {details.support.latestConversation}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Active services:</span> {details.commercial.activeServices}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Listed jobs:</span> {details.commercial.listedJobs}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Reviews:</span> {details.commercial.reviewCount}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Badges:</span> {details.commercial.badges}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessDetailsPanel({ details }: { details: BusinessDetails }) {
  return (
    <div className="space-y-4 rounded-lg border border-red-100 bg-red-50/30 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label="Hires" value={details.commercial.hires} icon={UserRound} />
        <DetailMetric label="Active shifts" value={details.commercial.activeShifts} icon={BriefcaseBusiness} />
        <DetailMetric label="Active payments" value={details.commercial.activePayments} icon={CreditCard} />
        <DetailMetric label="Last activity" value={details.profile.lastActivity} icon={Star} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Business account</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Business:</span> {details.profile.name}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Legal name:</span> {details.profile.legalName}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Registration:</span> {details.profile.registrationNumber}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Type:</span> {details.profile.businessType}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Industry:</span> {details.profile.industry}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Location:</span> {details.profile.city} · {details.profile.country}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Address:</span> {details.profile.address}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Postal code:</span> {details.profile.postalCode}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Joined:</span> {details.profile.joined}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Updated:</span> {details.profile.updated}</p>
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Typical work setup</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(details.workSetup.workTypes.length ? details.workSetup.workTypes : ["No work types set"]).map((item) => (
                <StatusBadge key={`work-${item}`} value={item} />
              ))}
              {(details.workSetup.roles.length ? details.workSetup.roles : ["No roles set"]).map((item) => (
                <StatusBadge key={`role-${item}`} value={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Screening and owner</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Admin status:</span> {details.verification.status}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Verified:</span> {details.verification.verified}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Reviewed:</span> {details.verification.reviewedAt}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Registration proof:</span> {details.verification.registration}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Documents:</span> {details.verification.documentCount}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Missing required docs:</span> {details.verification.missingRequiredDocuments}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Owner:</span> {details.owner.name}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Owner role:</span> {details.owner.role}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Owner email:</span> {details.owner.email}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Owner phone:</span> {details.owner.phone}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Profile row:</span> {details.owner.profileRow ? "Added" : "Not added"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">User row:</span> {details.owner.userProfileRow ? "Added" : "Not added"}</p>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Rejection / document note: {details.verification.rejectionReason}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <DetailMetric label="Jobs" value={details.commercial.jobs} icon={BriefcaseBusiness} />
        <DetailMetric label="Active jobs" value={details.commercial.activeJobs} icon={ShieldCheck} />
        <DetailMetric label="Applications" value={details.commercial.applications} icon={Mail} />
        <DetailMetric label="Paid payments" value={`${details.commercial.paidPayments} · ${details.commercial.totalPaid}`} icon={CreditCard} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DetailList title="Verification documents" empty="No business verification documents found." items={details.documents} />
        <DetailList title="Recent business jobs" empty="No business jobs or shifts found." items={details.recentPosts} />
        <DetailList title="Applications and hires" empty="No worker applications found." items={details.recentApplications} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DetailList title="Shift payments" empty="No shift payment records found." items={details.recentPayments} />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Payment and work totals</h3>
          <div className="mt-3 grid gap-3">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Active payments:</span> {details.commercial.activePayments}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Paid payments:</span> {details.commercial.paidPayments}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Released payments:</span> {details.commercial.releasedPayments}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Total paid/held:</span> {details.commercial.totalPaid}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Held now:</span> {details.commercial.totalHeld}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">Support and activity</h3>
          <div className="mt-3 grid gap-3">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Support threads:</span> {details.support.conversations}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Active threads:</span> {details.support.activeConversations}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Unread notices:</span> {details.support.unreadNotifications}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Latest notice:</span> {details.support.latestNotification}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Latest conversation:</span> {details.support.latestConversation}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Last activity:</span> {details.profile.lastActivity}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UsersWorklist({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(users);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterOption>("all");
  const [risk, setRisk] = useState<FilterOption>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detailsByUser, setDetailsByUser] = useState<Record<string, UserDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((user) => {
      const statusMatch = status === "all" || user.status === status;
      const riskMatch = risk === "all" || user.risk === risk;
      return statusMatch && riskMatch && includesQuery(Object.values(user), query);
    });
  }, [query, risk, rows, status]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((user) => selected.has(user.id));

  useEffect(() => {
    setRows(users);
  }, [users]);

  async function runBulkAction(action: "message" | "watchlist" | "block" | "open", userIds = Array.from(selected)) {
    if (!userIds.length) return;
    setMessage(null);
    const response = await fetch("/api/admin/users/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userIds }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(payload.error || "User action failed");
      return;
    }

    if (payload.status) {
      setRows((current) => current.map((user) => {
        if (!userIds.includes(user.id)) return user;
        if (payload.status === "blocked") return { ...user, status: "Blocked", risk: "High" };
        if (payload.status === "watchlisted") return { ...user, status: "Watchlisted", risk: "Medium" };
        return { ...user, status: "Active", risk: "Low" };
      }));
    }
    setSelected(new Set());
    setMessage(payload.message || `${action} completed.`);
    router.refresh();
    window.setTimeout(() => setMessage(null), 4500);
  }

  async function openUser(user: AdminUser) {
    if (expandedUserId === user.id) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(user.id);
    setDetailsError(null);
    if (detailsByUser[user.id]) return;

    setLoadingDetails(user.id);
    const response = await fetch(`/api/admin/users/details?id=${encodeURIComponent(user.id)}`);
    const payload = await response.json().catch(() => ({}));
    setLoadingDetails(null);

    if (!response.ok) {
      setDetailsError(payload.error || "Failed to load user details");
      return;
    }
    setDetailsByUser((current) => ({ ...current, [user.id]: payload as UserDetails }));
  }

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
        <button type="button" onClick={() => runBulkAction("message")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
          <Mail className="h-4 w-4" /> Message
        </button>
        <button type="button" onClick={() => runBulkAction("watchlist")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
          <ShieldAlert className="h-4 w-4" /> Watchlist
        </button>
        <button type="button" onClick={() => runBulkAction("block")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
          <UserX className="h-4 w-4" /> Block
        </button>
      </BulkBar>
      {message ? <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div> : null}

      <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed divide-y divide-slate-200">
            <colgroup>
              <col className="w-12" />
              <col className="w-[330px]" />
              <col className="w-[130px]" />
              <col className="w-[105px]" />
              <col className="w-[105px]" />
              <col className="w-[120px]" />
              <col className="w-[145px]" />
              <col className="w-[120px]" />
              <col className="w-[113px]" />
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input aria-label="Select all users" type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
                </th>
                {["User", "City", "Bookings", "Spend", "Risk", "Status", "Last seen", "Action"].map((column) => (
                  <th key={column} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${column === "Action" ? "text-right" : ""}`}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <Fragment key={user.id}>
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4"><input aria-label={`Select ${user.name}`} type="checkbox" checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} /></td>
                    <td className="px-4 py-4">
                      <p title={user.name} className="truncate text-sm font-medium text-slate-950">{user.name}</p>
                      <p title={user.email} className="truncate text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700"><div title={user.city} className="truncate">{user.city}</div></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{user.bookings}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{user.spend}</td>
                    <td className="px-4 py-4"><StatusBadge value={user.risk} /></td>
                    <td className="px-4 py-4"><StatusBadge value={user.status} /></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{user.lastSeen}</td>
                    <td className="px-4 py-4 text-right">
                      <button type="button" onClick={() => openUser(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        {expandedUserId === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {expandedUserId === user.id ? "Close" : "Open"}
                      </button>
                    </td>
                  </tr>
                  {expandedUserId === user.id ? (
                    <tr key={`${user.id}-details`}>
                      <td colSpan={9} className="bg-slate-50 p-0">
                        <div className="w-full px-4 py-4">
                        {loadingDetails === user.id ? (
                          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                            <UserRound className="h-4 w-4 animate-pulse" />
                            Loading full buyer profile, jobs, payments, and risk data...
                          </div>
                        ) : detailsError ? (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{detailsError}</div>
                        ) : detailsByUser[user.id] ? (
                          <UserDetailsPanel details={detailsByUser[user.id]} />
                        ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
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
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [detailsByProvider, setDetailsByProvider] = useState<Record<string, ProviderDetails>>({});
  const [loadingProviderDetails, setLoadingProviderDetails] = useState<string | null>(null);
  const [providerDetailsError, setProviderDetailsError] = useState<string | null>(null);

  const services = Array.from(new Set(providers.map((provider) => provider.service)));
  const filtered = useMemo(() => {
    return providers.filter((provider) => {
      const kycMatch = kyc === "all" || provider.kycStatus === kyc;
      const serviceMatch = service === "all" || provider.service === service;
      return kycMatch && serviceMatch && includesQuery(Object.values(provider), query);
    });
  }, [kyc, providers, query, service]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((provider) => selected.has(provider.id));
  const selectedProviders = providers.filter((provider) => selected.has(provider.id));
  const hasSelectedInactiveProviders = selectedProviders.some((provider) => provider.accountStatus !== "Active" && provider.docsSubmitted);
  const hasSelectedActiveProviders = selectedProviders.some((provider) => provider.accountStatus === "Active");

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

  function eligibleProviderIds(providerIds: string[], action: "approve" | "request_docs" | "reject" | "suspend") {
    if (action === "suspend") {
      return providers
        .filter((provider) => providerIds.includes(provider.id) && provider.accountStatus === "Active")
        .map((provider) => provider.id);
    }
    if (action === "request_docs") return providerIds;
    return providers
      .filter((provider) => providerIds.includes(provider.id) && provider.docsSubmitted && provider.accountStatus !== "Active")
      .map((provider) => provider.id);
  }

  async function runKycAction(action: "approve" | "request_docs" | "reject" | "suspend", providerIds = Array.from(selected)) {
    providerIds = eligibleProviderIds(providerIds, action);
    if (!providerIds.length) {
      setMessage(`${action === "suspend" ? "Suspend" : action === "approve" ? "Approve" : "Reject"} needs an eligible provider in the current view.`);
      return;
    }
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

  async function openProvider(provider: AdminProvider) {
    if (expandedProviderId === provider.id) {
      setExpandedProviderId(null);
      return;
    }

    setExpandedProviderId(provider.id);
    setProviderDetailsError(null);
    if (detailsByProvider[provider.id]) return;

    setLoadingProviderDetails(provider.id);
    const response = await fetch(`/api/admin/providers/details?id=${encodeURIComponent(provider.id)}`);
    const payload = await response.json().catch(() => ({}));
    setLoadingProviderDetails(null);

    if (!response.ok) {
      setProviderDetailsError(payload.error || "Failed to load provider details");
      return;
    }
    setDetailsByProvider((current) => ({ ...current, [provider.id]: payload as ProviderDetails }));
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[1fr_190px_170px_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="Search provider, service, city, document" />
          <select value={kyc} onChange={(event) => setKyc(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All KYC statuses</option>
            <option value="Approved">Approved</option>
            <option value="Suspended">Suspended</option>
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
        {hasSelectedInactiveProviders ? (
          <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("approve")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" /> Approve KYC
          </button>
        ) : null}
        {hasSelectedActiveProviders ? (
          <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("suspend")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
            <UserX className="h-4 w-4" /> Suspend
          </button>
        ) : null}
        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("request_docs")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <Mail className="h-4 w-4" /> Request docs
        </button>
      </BulkBar>
      {message ? <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div> : null}

      <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] table-fixed divide-y divide-slate-200">
            <colgroup>
              <col className="w-12" />
              <col className="w-[260px]" />
              <col className="w-[150px]" />
              <col className="w-[130px]" />
              <col className="w-[150px]" />
              <col className="w-[145px]" />
              <col className="w-[120px]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input aria-label="Select all providers" type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
                </th>
                {["Provider", "Service", "City", "KYC", "Document status", "Account", "Action"].map((column) => (
                  <th key={column} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${column === "Action" ? "text-right" : ""}`}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((provider) => (
                <Fragment key={provider.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-4"><input aria-label={`Select ${provider.name}`} type="checkbox" checked={selected.has(provider.id)} onChange={() => toggleOne(provider.id)} /></td>
                    <td className="px-4 py-4">
                      <a
                        href={`/providers/${provider.id}`}
                        onClick={(event) => {
                          event.preventDefault();
                          openProvider(provider);
                        }}
                        className="inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-red-700 underline-offset-4 hover:underline"
                        aria-expanded={expandedProviderId === provider.id}
                      >
                        <span title={provider.name} className="truncate">{provider.name}</span>
                        {expandedProviderId === provider.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </a>
                      <p title={provider.id} className="truncate text-xs text-slate-500">{provider.id}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700"><div title={provider.service} className="truncate">{provider.service}</div></td>
                    <td className="px-4 py-4 text-sm text-slate-700"><div title={provider.city} className="truncate">{provider.city}</div></td>
                    <td className="px-4 py-4"><StatusBadge value={provider.kycStatus} /></td>
                    <td className="px-4 py-4"><StatusBadge value={provider.documentStatus} /></td>
                    <td className="px-4 py-4"><StatusBadge value={provider.accountStatus} /></td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-nowrap justify-end gap-2 whitespace-nowrap">
                        {provider.accountStatus === "Active" ? (
                          <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("suspend", [provider.id])} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">Suspend</button>
                        ) : provider.docsSubmitted ? (
                          <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("approve", [provider.id])} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">Approve</button>
                        ) : null}
                        <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("request_docs", [provider.id])} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                          {provider.docsSubmitted ? "Review docs" : "Request docs"}
                        </button>
                        {provider.docsSubmitted && provider.accountStatus !== "Active" ? (
                          <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("reject", [provider.id])} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">Reject</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {expandedProviderId === provider.id ? (
                    <tr>
                      <td colSpan={8} className="bg-slate-50 p-0">
                        <div className="w-full px-4 py-4">
                          {loadingProviderDetails === provider.id ? (
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                              <ShieldCheck className="h-4 w-4 animate-pulse" />
                              Loading provider profile, KYC, services, bookings, bids, and review data...
                            </div>
                          ) : providerDetailsError ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{providerDetailsError}</div>
                          ) : detailsByProvider[provider.id] ? (
                            <ProviderDetailsPanel details={detailsByProvider[provider.id]} />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{filtered.length} providers shown</div>
      </div>
    </>
  );
}

export function BusinessesWorklist({ businesses }: { businesses: AdminBusiness[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(businesses);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterOption>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null);
  const [detailsByBusiness, setDetailsByBusiness] = useState<Record<string, BusinessDetails>>({});
  const [loadingBusinessDetails, setLoadingBusinessDetails] = useState<string | null>(null);
  const [businessDetailsError, setBusinessDetailsError] = useState<string | null>(null);

  useEffect(() => {
    setRows(businesses);
  }, [businesses]);

  const filtered = useMemo(() => {
    return rows.filter((business) => {
      const statusMatch = status === "all" || business.status === status;
      return statusMatch && includesQuery(Object.values(business), query);
    });
  }, [query, rows, status]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((business) => selected.has(business.id));
  const selectedBusinesses = rows.filter((business) => selected.has(business.id));
  const hasSelectedApprovedBusinesses = selectedBusinesses.some((business) => business.status === "approved");
  const hasSelectedUnapprovedBusinesses = selectedBusinesses.some((business) => business.status !== "approved");

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) filtered.forEach((business) => next.delete(business.id));
      else filtered.forEach((business) => next.add(business.id));
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

  async function runBusinessAction(action: "approve" | "reject" | "request_docs" | "suspend", businessIds = Array.from(selected)) {
    if (!businessIds.length) return;
    setPendingAction(action);
    setMessage(null);

    const response = await fetch("/api/admin/businesses/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, businessIds }),
    });
    const payload = await response.json().catch(() => ({}));
    setPendingAction(null);

    if (!response.ok) {
      setMessage(payload.error || "Business review update failed");
      return;
    }

    setSelected(new Set());
    setRows((current) => current.map((business) => (
      businessIds.includes(business.id) ? { ...business, status: payload.status || business.status } : business
    )));
    setMessage(`Updated ${businessIds.length} business${businessIds.length === 1 ? "" : "es"}.`);
    router.refresh();
  }

  async function openBusiness(business: AdminBusiness) {
    if (expandedBusinessId === business.id) {
      setExpandedBusinessId(null);
      return;
    }

    setExpandedBusinessId(business.id);
    setBusinessDetailsError(null);
    if (detailsByBusiness[business.id]) return;

    setLoadingBusinessDetails(business.id);
    const response = await fetch(`/api/admin/businesses/details?id=${encodeURIComponent(business.id)}`);
    const payload = await response.json().catch(() => ({}));
    setLoadingBusinessDetails(null);

    if (!response.ok) {
      setBusinessDetailsError(payload.error || "Failed to load business details");
      return;
    }
    setDetailsByBusiness((current) => ({ ...current, [business.id]: payload as BusinessDetails }));
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[1fr_190px_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100" placeholder="Search business, registration number, city, contact" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={() => { setQuery(""); setStatus("all"); }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Reset
          </button>
        </div>
      </div>

      <BulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        {hasSelectedUnapprovedBusinesses ? (
          <button disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("approve")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" /> Approve
          </button>
        ) : null}
        {hasSelectedApprovedBusinesses ? (
          <button disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("suspend")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
            <UserX className="h-4 w-4" /> Suspend
          </button>
        ) : null}
        <button disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("request_docs")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
          <Mail className="h-4 w-4" /> Request docs
        </button>
        {hasSelectedUnapprovedBusinesses ? (
          <button disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("reject")} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-60">
            <ShieldAlert className="h-4 w-4" /> Reject
          </button>
        ) : null}
      </BulkBar>
      {message ? <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div> : null}

      <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] table-fixed divide-y divide-slate-200">
            <colgroup>
              <col className="w-11" />
              <col className="w-[190px]" />
              <col className="w-[145px]" />
              <col className="w-[250px]" />
              <col className="w-[165px]" />
              <col className="w-[80px]" />
              <col className="w-[95px]" />
              <col className="w-[88px]" />
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3">
                  <input aria-label="Select all businesses" type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
                </th>
                {["Business", "Registration", "Contact", "Work types", "Created", "Status", "Action"].map((column) => (
                  <th
                    key={column}
                    className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${column === "Action" ? "text-right" : ""}`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((business) => (
                <Fragment key={business.id}>
                  <tr className="group hover:bg-slate-50">
                    <td className="px-3 py-4"><input aria-label={`Select ${business.name}`} type="checkbox" checked={selected.has(business.id)} onChange={() => toggleOne(business.id)} /></td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => openBusiness(business)}
                        className="inline-flex max-w-full items-center gap-1.5 text-left text-sm font-semibold text-red-700 underline-offset-4 hover:underline"
                        aria-expanded={expandedBusinessId === business.id}
                      >
                        <span title={business.name} className="truncate">{business.name}</span>
                        {expandedBusinessId === business.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </button>
                      <p title={`${business.industry} · ${business.city} · ${business.id}`} className="truncate text-xs text-slate-500">
                        {business.industry} · {business.city}
                      </p>
                    </td>
                    <TruncatedCell>{business.registrationNumber}</TruncatedCell>
                    <TruncatedCell>{business.contact}</TruncatedCell>
                    <TruncatedCell>{business.workTypes}</TruncatedCell>
                    <TruncatedCell>{business.created}</TruncatedCell>
                    <td className="px-3 py-4"><StatusBadge value={business.status} /></td>
                    <td className="px-3 py-4">
                      <div className="flex flex-nowrap justify-end gap-1.5 whitespace-nowrap">
                        {business.status === "approved" ? (
                          <button title="Suspend business" aria-label={`Suspend ${business.name}`} disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("suspend", [business.id])} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60">
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button title="Approve business" aria-label={`Approve ${business.name}`} disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("approve", [business.id])} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button title="Request documents" aria-label={`Request documents from ${business.name}`} disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("request_docs", [business.id])} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                          <Mail className="h-4 w-4" />
                        </button>
                        {business.status !== "approved" ? (
                          <button title="Reject business" aria-label={`Reject ${business.name}`} disabled={Boolean(pendingAction)} onClick={() => runBusinessAction("reject", [business.id])} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60">
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {expandedBusinessId === business.id ? (
                    <tr>
                      <td colSpan={8} className="bg-slate-50 p-0">
                        <div className="w-full px-4 py-4">
                          {loadingBusinessDetails === business.id ? (
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                              <BriefcaseBusiness className="h-4 w-4 animate-pulse" />
                              Loading business account, verification, hires, shifts, payments, and activity...
                            </div>
                          ) : businessDetailsError ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{businessDetailsError}</div>
                          ) : detailsByBusiness[business.id] ? (
                            <BusinessDetailsPanel details={detailsByBusiness[business.id]} />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">{filtered.length} businesses shown</div>
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
    if (action === "request_docs") return reviewIds;
    return reviews.filter((review) => reviewIds.includes(review.id) && review.docsSubmitted).map((review) => review.id);
  }

  async function runKycAction(action: "approve" | "request_docs" | "reject", reviewIds = Array.from(selected)) {
    reviewIds = eligibleReviewIds(reviewIds, action);
    const providerIds = providerIdsFor(reviewIds);
    if (!providerIds.length) {
      setMessage(`${action === "approve" ? "Approve" : "Reject"} needs a review with submitted documents.`);
      return;
    }
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
                      <button disabled={Boolean(pendingAction)} onClick={() => runKycAction("request_docs", [review.id])} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        {review.docsSubmitted ? "Review docs" : "Request docs"}
                      </button>
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
