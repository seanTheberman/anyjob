import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function coarsePostalCode(postalCode?: string | null) {
  const prefix = postalCode?.trim().slice(0, 3);
  return prefix ? `${prefix} area` : "";
}

// GET: Fetch details for a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // For debugging, let's try to get the user but also allow the query to work without authentication for now
    let user = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      user = userData.user;
    } catch (authError) {
      console.log('Auth error, proceeding without user:', authError);
    }

    // Await params since Next.js 15
    const resolvedParams = await params;
    const jobId = resolvedParams.id;

    // Fetch the specific job inquiry
    const { data: job, error } = await supabase
      .from('service_inquiries')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Job fetch error:', error);
      return NextResponse.json({ error: "Job not found", details: error.message }, { status: 404 });
    }

    // Check if user has already bid on this job (only if user is authenticated)
    let myBid = null;
    if (user) {
      try {
        const { data: bidData } = await supabase
          .from('bids')
          .select('id, amount, status, created_at')
          .eq('inquiry_id', jobId)
          .eq('provider_id', user.id)
          .single();
        myBid = bidData;
      } catch (bidError) {
        // No bid found, that's okay
        myBid = null;
      }
    }

    // Get bid count for this job
    const { count: bidCount } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('inquiry_id', jobId);

    // Get work images count and actual images
    const { data: images, error: imagesError } = await supabase
      .from('user_images')
      .select('id, image_url, public_id, created_at')
      .eq('inquiry_id', jobId)
      .eq('image_type', 'work_image')
      .order('created_at', { ascending: true });

    const imageCount = images?.length || 0;

    const showContact = myBid?.status === 'accepted';
    const coarseLabel = job.coarse_location_label || [job.city, coarsePostalCode(job.postal_code)].filter(Boolean).join(', ');

    // Transform the data to match the expected format
    const transformedJob = {
      id: job.id,
      title: job.job_description ? job.job_description.split('.').slice(0, 2).join('.').trim() : 'Service Request',
      description: job.job_description || 'No description provided',
      client: {
        name: `${job.first_name} ${job.last_name}`,
        email: user && showContact ? job.email : undefined, // Only after bid accepted
        phone: user && showContact ? job.phone : undefined, // Only after bid accepted
        photo: undefined,
        rating: undefined,
        reviewCount: undefined
      },
      budget: {
        min: parseFloat(job.budget_range_min) || 0,
        max: parseFloat(job.budget_range_max) || 0,
        currency: "€"
      },
      location: {
        address: showContact ? (job.address || 'Address not provided') : (coarseLabel || 'Approximate location only'),
        city: job.city || 'Unknown',
        postalCode: showContact ? (job.postal_code || '') : coarsePostalCode(job.postal_code),
        coarseLabel,
        latitude: showContact ? job.latitude : job.coarse_latitude,
        longitude: showContact ? job.longitude : job.coarse_longitude,
        exactAddressVisible: showContact
      },
      category: job.category_slug || 'general',
      customTags: job.custom_tags || [],
      serviceType: job.service_type || 'One time',
      urgency: job.job_urgency || 'medium',
      duration: job.estimated_duration_hours ? `${job.estimated_duration_hours} hours` : 'Not specified',
      peopleNeeded: job.number_of_people_needed || 1,
      date: job.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : 'Flexible',
      startTime: job.preferred_time_start ? job.preferred_time_start.slice(0, 5) : 'Not specified',
      endTime: job.preferred_time_end ? job.preferred_time_end.slice(0, 5) : 'Not specified',
      materials: job.materials_provided ? 'Client provides materials' : 'Provider should bring materials',
      equipment: job.equipment_needed || 'No specific equipment needed',
      postedAt: new Date(job.submitted_at).toLocaleDateString(),
      status: job.status || 'submitted',
      bid_count: bidCount || 0,
      my_bid: myBid,
      work_image_count: imageCount,
      work_images: images || []
    };

    return NextResponse.json({ job: transformedJob });
  } catch (error) {
    console.error('Error fetching job details:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch job details", details: message }, { status: 500 });
  }
}
