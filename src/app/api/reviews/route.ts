import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      service_inquiry_id,
      reviewee_id,
      review_type,
      rating,
      title,
      comment,
      communication_rating,
      professionalism_rating,
      quality_rating,
      punctuality_rating,
      would_hire_again,
      would_work_with_again,
    } = body;

    // Validate required fields
    if (!service_inquiry_id || !reviewee_id || !review_type || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate review type
    if (!["buyer_to_seller", "seller_to_buyer"].includes(review_type)) {
      return NextResponse.json({ error: "Invalid review type" }, { status: 400 });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if the service inquiry exists and the user is involved
    const { data: inquiry, error: inquiryError } = await supabase
      .from("service_inquiries")
      .select("*")
      .eq("id", service_inquiry_id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: "Service inquiry not found" }, { status: 404 });
    }

    // Check if the user is involved in this inquiry
    const isBuyer = inquiry.user_id === user.id;
    // For demo purposes, allow any buyer to review if they are the inquiry owner
    const isSeller = false; // Simplified for testing

    if (!isBuyer) {
      return NextResponse.json({ error: "Only buyers can submit reviews for testing" }, { status: 403 });
    }

    // Determine reviewee based on review type and user role
    let revieweeId: string;
    
    if (review_type === "buyer_to_seller" && isBuyer) {
      // For demo, use the first matched provider
      if (!inquiry.matched_provider_ids || inquiry.matched_provider_ids.length === 0) {
        throw new Error("No provider found to review");
      }
      revieweeId = inquiry.matched_provider_ids[0];
    } else if (review_type === "seller_to_buyer" && !isBuyer) {
      revieweeId = inquiry.user_id;
    } else {
      throw new Error("Invalid review type for this user");
    }

    // Check if the inquiry is completed
    if (inquiry.status !== "completed" && inquiry.status !== "converted") {
      return NextResponse.json({ error: "You can only review completed jobs" }, { status: 400 });
    }

    // Check if a review already exists
    const { data: existingReview, error: existingError } = await supabase
      .from("reviews")
      .select("*")
      .eq("service_inquiry_id", service_inquiry_id)
      .eq("reviewer_id", user.id)
      .eq("review_type", review_type)
      .single();

    if (existingReview && !existingError) {
      return NextResponse.json({ error: "You have already submitted a review for this job" }, { status: 409 });
    }

    // Create the review
    const reviewData: any = {
      service_inquiry_id,
      reviewer_id: user.id,
      reviewee_id,
      review_type,
      rating,
      title,
      comment,
    };

    // Add optional fields if provided
    if (communication_rating !== undefined) reviewData.communication_rating = communication_rating;
    if (professionalism_rating !== undefined) reviewData.professionalism_rating = professionalism_rating;
    if (quality_rating !== undefined) reviewData.quality_rating = quality_rating;
    if (punctuality_rating !== undefined) reviewData.punctuality_rating = punctuality_rating;
    if (would_hire_again !== undefined) reviewData.would_hire_again = would_hire_again;
    if (would_work_with_again !== undefined) reviewData.would_work_with_again = would_work_with_again;

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select()
      .single();

    if (reviewError) {
      console.error("Error creating review:", reviewError);
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    return NextResponse.json({ review }, { status: 201 });

  } catch (error) {
    console.error("Error in POST /api/reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceInquiryId = searchParams.get("service_inquiry_id");
    const revieweeId = searchParams.get("reviewee_id");
    const reviewType = searchParams.get("review_type");

    let query = supabase
      .from("reviews")
      .select(`
        *,
        reviewer:auth.users!reviews_reviewer_id_fkey (
          id,
          email,
          user_metadata
        )
      `);

    // Filter by service inquiry if specified
    if (serviceInquiryId) {
      query = query.eq("service_inquiry_id", serviceInquiryId);
    }

    // Filter by reviewee if specified
    if (revieweeId) {
      query = query.eq("reviewee_id", revieweeId);
    }

    // Filter by review type if specified
    if (reviewType) {
      query = query.eq("review_type", reviewType);
    }

    // Only show reviews where the user is the reviewer or reviewee
    query = query.or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`);

    const { data: reviews, error: reviewsError } = await query.order("created_at", { ascending: false });

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    return NextResponse.json({ reviews }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
