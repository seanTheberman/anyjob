import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { api, jsonBody } from "@/lib/api";
import { Button, Card, Field, Header, Screen } from "@/components/ui";
import { colors } from "@/theme/tokens";

export default function NewReviewScreen() {
  const params = useLocalSearchParams<{ serviceInquiryId?: string; shiftApplicationId?: string; type?: string; revieweeId?: string }>(); const router = useRouter(); const client = useQueryClient(); const [rating, setRating] = useState(5); const [title, setTitle] = useState(""); const [comment, setComment] = useState("");
  const mutation = useMutation({ mutationFn: () => api("/api/reviews", { method: "POST", ...jsonBody({ service_inquiry_id: params.serviceInquiryId, shift_application_id: params.shiftApplicationId, review_type: params.type, reviewee_id: params.revieweeId, rating, title, comment, communication_rating: rating, professionalism_rating: rating, quality_rating: rating, punctuality_rating: rating, would_hire_again: rating >= 4, would_work_with_again: rating >= 4 }) }), onSuccess: () => { void client.invalidateQueries({ queryKey: ["reviews"] }); void client.invalidateQueries({ queryKey: ["notifications"] }); Alert.alert("Review published", "Your feedback is visible on the recipient’s profile and they have been notified."); router.replace("/reviews"); }, onError: (error: Error) => Alert.alert("Could not publish review", error.message) });
  return <Screen><Header title="Leave a review" subtitle="Reviews are available to both sides after completed work." /><Card><Text style={styles.label}>Overall rating</Text><View style={styles.stars}>{Array.from({ length: 5 }, (_, index) => <Pressable accessibilityRole="button" accessibilityLabel={`${index + 1} star${index === 0 ? "" : "s"}`} key={index} onPress={() => setRating(index + 1)}><Star size={36} color="#f4b400" fill={index < rating ? "#f4b400" : "transparent"} /></Pressable>)}</View><Field label="Review title" value={title} onChangeText={setTitle} /><Field label="Your feedback" multiline value={comment} onChangeText={setComment} /></Card><Button title="Publish review" onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={comment.trim().length < 10} /></Screen>;
}
const styles = StyleSheet.create({ label: { color: colors.ink, fontWeight: "800" }, stars: { flexDirection: "row", justifyContent: "space-between", maxWidth: 280 } });
