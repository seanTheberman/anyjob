import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/lib/api";
import {
  Avatar,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
} from "@/components/ui";
import { useAppTheme } from "@/providers/theme-provider";
import type { Review } from "@/types/domain";

export default function ReviewsScreen() {
  const { colors } = useAppTheme();
  const query = useQuery({
    queryKey: ["reviews", "received"],
    queryFn: () =>
      api<{ reviews: Review[] }>("/api/reviews?received=true&limit=100"),
  });
  const rows = query.data?.reviews || [];
  const average = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length
    : 0;

  return (
    <Screen>
      <Header
        title="Reviews"
        subtitle="Your reputation across completed work."
      />
      <View
        style={[
          styles.summary,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <View style={[styles.starWell, { backgroundColor: "#f4b40018" }]}>
          <Star color="#f4b400" fill="#f4b400" size={25} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.average, { color: colors.ink }]}>
            {rows.length ? average.toFixed(1) : "New"}
          </Text>
          <Text style={[styles.count, { color: colors.muted }]}>
            {rows.length} review{rows.length === 1 ? "" : "s"} received
          </Text>
        </View>
        <View style={styles.fiveStars}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              color="#f4b400"
              fill={
                rows.length && index < Math.round(average)
                  ? "#f4b400"
                  : "transparent"
              }
              size={13}
            />
          ))}
        </View>
      </View>
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          retry={() => void query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No reviews received"
          body="Reviews become available after completed work."
        />
      ) : (
        <View style={styles.reviewList}>
          {rows.map((review) => {
            const person = review.reviewer;
            const name =
              [person?.first_name, person?.last_name]
                .filter(Boolean)
                .join(" ") || "AnyJob user";
            return (
              <View
                style={[
                  styles.review,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
                key={review.id}
              >
                <View style={styles.reviewer}>
                  <Avatar
                    name={name}
                    uri={person?.avatar_url || person?.profile_image_url}
                    size={38}
                  />
                  <View style={styles.reviewerCopy}>
                    <Text style={[styles.name, { color: colors.ink }]}>
                      {name}
                    </Text>
                    <View style={styles.stars}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={13}
                          color="#f4b400"
                          fill={
                            index < review.rating ? "#f4b400" : "transparent"
                          }
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.date, { color: colors.muted }]}>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString()
                      : ""}
                  </Text>
                </View>
                {review.title ? (
                  <Text style={[styles.title, { color: colors.ink }]}>
                    {review.title}
                  </Text>
                ) : null}
                {review.comment ? (
                  <Text style={[styles.comment, { color: colors.muted }]}>
                    {review.comment}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  starWell: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: { flex: 1, gap: 2 },
  average: { fontWeight: "900", fontSize: 25, lineHeight: 28 },
  count: { fontSize: 11.5 },
  fiveStars: { flexDirection: "row", gap: 2 },
  reviewList: { gap: 10 },
  review: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 9 },
  reviewer: { flexDirection: "row", alignItems: "center", gap: 9 },
  reviewerCopy: { flex: 1, gap: 3 },
  name: { fontWeight: "900", fontSize: 13 },
  stars: { flexDirection: "row", gap: 1 },
  date: { fontSize: 10.5 },
  title: { fontWeight: "900", fontSize: 15 },
  comment: { fontSize: 12.5, lineHeight: 19 },
});
