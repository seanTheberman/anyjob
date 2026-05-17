"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function ProviderProfileClient({ 
    provider 
}: { 
    provider: any 
}) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <>
            {/* Give Rating */}
            <div className="mb-6">
                <div className="text-gray-700 mb-2">Give us rating</div>
                <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                        >
                            <Star
                                className={`w-6 h-6 transition-colors ${
                                    star <= (hoverRating || rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-gray-200 text-gray-200"
                                }`}
                            />
                        </button>
                    ))}
                </div>
                <button className="text-red-600 text-sm flex items-center gap-1 hover:underline">
                    <span>✏️</span>
                    <span>Write a Review</span>
                </button>
            </div>

            {/* Review Form */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8">
                <textarea
                    placeholder="Share your experience..."
                    rows={6}
                    className="w-full bg-gray-100 border-0 focus:outline-none resize-none text-gray-700"
                />
            </div>
            <div className="flex justify-end">
                <button className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                    Submit
                </button>
            </div>
        </>
    );
}
