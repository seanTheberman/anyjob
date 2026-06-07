"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculateBookingTokenBreakdown, formatMoney } from "@/lib/booking-token";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone,
  Star,
  ArrowLeft,
  Send,
  Loader2
} from "lucide-react";

interface JobDetails {
  id: string;
  title: string;
  description: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    photo?: string;
    rating?: number;
    reviewCount?: number;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    address: string;
    city: string;
    postalCode: string;
  };
  category: string;
  customTags?: string[];
  serviceType: string;
  urgency: string;
  duration: string;
  peopleNeeded: number;
  date: string;
  startTime: string;
  endTime: string;
  materials: string;
  equipment: string;
  postedAt: string;
  status: string;
  bid_count: number;
  my_bid?: {
    amount: number;
    status: string;
  } | null;
  work_image_count: number;
  work_images?: Array<{
    id: string;
    image_url: string;
  }>;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Job not found");
        } else {
          setError("Failed to fetch job details");
        }
        return;
      }
      
      const data = await response.json();
      setJob(data.job);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError("Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }

    try {
      setSubmittingBid(true);
      setError(null);

      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inquiry_id: jobId,
          amount: parseFloat(bidAmount),
          message: bidMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit bid");
        return;
      }

      // Refresh job details to show the new bid
      await fetchJobDetails();
      
      // Reset form
      setBidAmount("");
      setBidMessage("");
      
    } catch (error) {
      console.error('Error submitting bid:', error);
      setError("Failed to submit bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <ProviderLayout>
        <div className="max-w-4xl mx-auto mt-4 lg:mt-6 flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading job details...</span>
        </div>
      </ProviderLayout>
    );
  }

  if (error || !job) {
    return (
      <ProviderLayout>
        <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
            <p className="text-gray-600 mb-6">{error || "This job may have been removed or is no longer available."}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  const existingBid = job.my_bid ?? null;
  const bidAmountValue = parseFloat(bidAmount);
  const hasBidAmount = Number.isFinite(bidAmountValue) && bidAmountValue > 0;
  const feeBreakdown = calculateBookingTokenBreakdown(hasBidAmount ? bidAmountValue : 0);

  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 break-words">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">{job.category}</Badge>
                <Badge variant="outline" className="capitalize">{job.serviceType}</Badge>
                {job.urgency === 'asap' && <Badge variant="destructive">Urgent</Badge>}
                {job.bid_count > 0 && (
                  <Badge variant="outline">{job.bid_count} bid{job.bid_count > 1 ? 's' : ''}</Badge>
                )}
              </div>
              {job.customTags && job.customTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {job.customTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-red-200 bg-red-50 text-red-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="flex items-center justify-end gap-2 text-2xl font-semibold text-green-600 leading-none">
                <span className="text-base text-gray-500">{job.budget.currency}</span>
                <span>
                  {job.budget.min} - {job.budget.max}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Budget range</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </CardContent>
            </Card>

            {/* Work Images */}
            {job.work_images && job.work_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Work Images ({job.work_images.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {job.work_images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={image.image_url}
                            alt={`Work image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            onClick={() => {
                              // Simple image preview - could be enhanced with a modal
                              window.open(image.image_url, '_blank');
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Click to enlarge
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Click on any image to view it in full size
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Date:</strong> {job.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Time:</strong> {job.startTime} - {job.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Duration:</strong> {job.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>People needed:</strong> {job.peopleNeeded}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {job.location.address}<br />
                      {job.location.city}, {job.location.postalCode}
                    </span>
                  </div>
                </div>

                {job.materials && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Materials</h4>
                      <p className="text-sm text-gray-600">{job.materials}</p>
                    </div>
                  </>
                )}

                {job.equipment && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Equipment Needed</h4>
                      <p className="text-sm text-gray-600">{job.equipment}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bidding Section */}
            {!existingBid ? (
              <Card>
                <CardHeader>
                  <CardTitle>Place Your Bid</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitBid} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Your Bid Amount ({job.budget.currency})
                      </label>
                      <input
                        type="number"
                        min={job.budget.min}
                        max={job.budget.max * 1.5}
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Enter amount between ${job.budget.min} - ${job.budget.max}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Client budget: {job.budget.currency} {job.budget.min} - {job.budget.max}
                      </p>
                    </div>

                    {hasBidAmount && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Your job payout</span>
                          <span className="font-semibold text-gray-900">
                            {formatMoney(feeBreakdown.onsiteDue, job.budget.currency)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-gray-600">AnyJob fee added to buyer</span>
                          <span className="font-semibold text-gray-900">
                            {formatMoney(feeBreakdown.bookingToken, job.budget.currency)}
                          </span>
                        </div>
                        <div className="mt-3 border-t border-red-100 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Buyer sees total bid</span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatMoney(feeBreakdown.buyerTotal, job.budget.currency)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-gray-600">
                            The buyer is shown one total bid. AnyJob collects the fee when the buyer accepts; you collect your job payout at the location.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Message to Client (Optional)
                      </label>
                      <textarea
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        placeholder="Introduce yourself and explain why you're the right person for this job..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={submittingBid}
                      className="w-full"
                    >
                      {submittingBid ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Bid
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Bid Already Submitted</h3>
                      <p className="text-gray-600 mb-2">
                      You have already submitted a quote of {formatMoney(Number(existingBid.amount), job.budget.currency)}.
                      AnyJob will add its fee to the buyer&apos;s total bid.
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: <Badge variant="outline">{existingBid.status}</Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">{job.client.name}</h4>
                    {job.client.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{job.client.rating}</span>
                        {job.client.reviewCount && (
                          <span className="text-gray-500">({job.client.reviewCount} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {job.client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{job.client.phone}</span>
                  </div>
                )}
                
                {job.client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{job.client.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Posted</span>
                  <span className="text-sm font-medium">{job.postedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Bids</span>
                  <span className="text-sm font-medium">{job.bid_count}</span>
                </div>
                {job.work_image_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Images</span>
                    <span className="text-sm font-medium">{job.work_image_count}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
