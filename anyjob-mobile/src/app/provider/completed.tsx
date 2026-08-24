import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";

import { api } from "@/lib/api";
import { EmptyState, ErrorState, Header, ListGroup, LoadingState, Pill, RowLink, Screen, SectionHeader } from "@/components/ui";
import { colors } from "@/theme/tokens";

export default function CompletedScreen() {
  const router = useRouter(); const query = useQuery({ queryKey: ["provider-completed"], queryFn: () => api<any>("/api/provider/dashboard-data") });
  if (query.isLoading) return <Screen><Header title="Completed" /><LoadingState /></Screen>;
  if (query.isError) return <Screen><Header title="Completed" /><ErrorState message={(query.error as Error).message} /></Screen>;
  const bookings = query.data?.bookings || []; const requests = query.data?.completedServiceJobs || []; const shifts = query.data?.shiftApplications || []; const givenReviews = query.data?.givenReviews || []; const shiftReviews = query.data?.shiftReviews || [];
  const total = bookings.length + requests.length + shifts.length;
  return <Screen><Header title="Completed" subtitle="Service jobs and business shifts." />{total === 0 ? <EmptyState title="No completed work" body="Finished jobs and shifts will appear here." /> : <><SectionHeader title={`${total} completed`} /><ListGroup>{requests.map((item: any) => { const raw = String(item.inquiry?.job_description || "Completed service"); const title = raw.replace(/^Title:\s*/i, "").split("\n")[0]; const reviewed = givenReviews.some((review: any) => review.service_inquiry_id === item.inquiry?.id); return <RowLink key={item.id} title={title} subtitle={`${item.inquiry?.city || "Ireland"} · €${Number(item.amount || 0).toFixed(2)}`} icon={<CheckCircle2 color={colors.success} size={20} />} trailing={<Pill text={reviewed ? "Reviewed" : "Service"} tone="success" />} onPress={() => reviewed ? router.push("/reviews") : router.push(`/review/new?serviceInquiryId=${item.inquiry?.id}&type=seller_to_buyer&revieweeId=${item.inquiry?.user_id}`)} />; })}{bookings.map((item: any) => <RowLink key={item.id} title={item.service?.title || "Completed service"} subtitle={`${item.city || "Ireland"} · €${Number(item.total_price || 0).toFixed(2)}`} icon={<CheckCircle2 color={colors.success} size={20} />} trailing={<Pill text="Service" tone="success" />} onPress={() => router.push("/review/new?type=seller_to_buyer")} />)}{shifts.map((item: any) => { const reviewed = shiftReviews.some((review: any) => review.shift_application_id === item.id && review.review_type === "seller_to_buyer"); return <RowLink key={item.id} title={item.post?.role_title || "Completed shift"} subtitle={`${item.post?.city || "Ireland"} · €${Number(item.payment?.agreed_amount || 0).toFixed(2)}`} icon={<CheckCircle2 color={colors.success} size={20} />} trailing={<Pill text={reviewed ? "Reviewed" : "Shift"} tone="success" />} onPress={() => reviewed ? router.push("/reviews") : router.push(`/review/new?shiftApplicationId=${item.id}&type=seller_to_buyer&revieweeId=${item.owner_user_id}`)} />; })}</ListGroup></>}</Screen>;
}
