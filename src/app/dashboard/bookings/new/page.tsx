"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceQuestions } from "@/components/booking/ServiceQuestions";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Calendar, Clock, MapPin } from "lucide-react";

const STEPS = ["Category", "Questions", "Date & Location", "Review"];

type Category = {
    id: string;
    slug: string;
    name: string;
    color: string;
};

export default function NewBookingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [estimatedHours, setEstimatedHours] = useState("2");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCategories() {
            const supabase = createClient();
            const { data } = await supabase
                .from("eloo_categories")
                .select("id, slug, name, color")
                .eq("is_active", true)
                .order("sort_order");
            if (data) setCategories(data);
        }
        fetchCategories();
    }, []);

    function handleAnswerChange(key: string, value: string) {
        setAnswers((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit() {
        if (!selectedCategory) return;
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        const { error: insertError } = await supabase.from("eloo_bookings").insert({
            client_id: user.id,
            category_id: selectedCategory.id,
            title: title || `${selectedCategory.name} — ${city}`,
            description: `${description}\n\n--- Détails ---\n${JSON.stringify(answers, null, 2)}`,
            address,
            city,
            postal_code: postalCode,
            scheduled_date: date,
            scheduled_time: time,
            estimated_hours: parseFloat(estimatedHours) || 2,
            hourly_rate: 25, // Default rate, will be adjusted by provider
            client_notes: JSON.stringify(answers),
        });

        if (insertError) {
            setError(insertError.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    }

    function canProceed(): boolean {
        switch (step) {
            case 0: return !!selectedCategory;
            case 1: return true; // Questions are optional
            case 2: return !!date && !!time && !!address && !!city;
            default: return true;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : router.back()}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                        New Task
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Describe your needs to find the ideal provider
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-1 mb-8">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex-1">
                            <div
                                className={`h-1.5 rounded-full ${i <= step ? "bg-red-600" : "bg-gray-200 dark:bg-gray-800"
                                    }`}
                            />
                            <p className={`text-[10px] mt-1 ${i <= step ? "text-red-600 font-medium" : "text-gray-400"
                                }`}>
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm">
                    <CardContent className="p-6 sm:p-8">
                        {/* Step 0: Choose Category */}
                        {step === 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    What service are you looking for?
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${selectedCategory?.id === cat.id
                                                ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                                }`}
                                        >
                                            <CategoryIcon slug={cat.slug} className="w-7 h-7" />
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {cat.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Service-Specific Questions */}
                        {step === 1 && selectedCategory && (
                            <div>
                                <ServiceQuestions
                                    categorySlug={selectedCategory.slug}
                                    answers={answers}
                                    onChange={handleAnswerChange}
                                />

                                <div className="mt-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Request Title</Label>
                                        <Input
                                            placeholder={`Ex: ${selectedCategory.name} help`}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Additional Description</Label>
                                        <textarea
                                            placeholder="Add more details about your needs..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm outline-none focus:border-red-500 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Date, Time & Location */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    When and where?
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" /> Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> Heure <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Estimated duration (hours)</Label>
                                    <Input
                                        type="number"
                                        value={estimatedHours}
                                        onChange={(e) => setEstimatedHours(e.target.value)}
                                        className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                        min={1}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" /> Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="12 O'Connell Street"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">City <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Dublin"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Eircode</Label>
                                        <Input
                                            placeholder="D02 X285"
                                            value={postalCode}
                                            onChange={(e) => setPostalCode(e.target.value)}
                                            className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && selectedCategory && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    Review
                                </h2>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon slug={selectedCategory.slug} className="w-5 h-5" />
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {selectedCategory.name}
                                            </span>
                                        </div>
                                        {title && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Title:</strong> {title}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Date:</strong> {date} at {time}
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Duration:</strong> {estimatedHours}h
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Address:</strong> {address}, {postalCode} {city}
                                        </p>
                                    </div>

                                    {/* Answers Summary */}
                                    {Object.keys(answers).length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 space-y-2">
                                            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                                Task details
                                            </p>
                                            {Object.entries(answers).map(([key, value]) => (
                                                value && (
                                                    <p key={key} className="text-sm text-red-700 dark:text-red-400">
                                                        <strong>{key.replace(/_/g, " ")} :</strong> {value}
                                                    </p>
                                                )
                                            ))}
                                        </div>
                                    )}

                                    {/* Price Estimate */}
                                    <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4">
                                        <p className="text-sm text-green-800 dark:text-green-300 font-semibold">
                                            Price Estimate
                                        </p>
                                        <p className="text-2xl font-extrabold text-green-700 dark:text-green-400 mt-1">
                                            ~${(parseFloat(estimatedHours) * 25).toFixed(0)}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                                            Based on {estimatedHours}h at $25/h (average rate). Final price depends on the provider.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6 gap-4">
                    {step > 0 ? (
                        <Button
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                            className="rounded-xl px-6 py-5"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < STEPS.length - 1 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="rounded-xl px-6 py-5 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Next <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="rounded-xl px-8 py-5 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                                <>Confirm and publish <CheckCircle className="w-4 h-4 ml-1" /></>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
