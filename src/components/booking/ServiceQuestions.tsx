"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ────────────────────────────────────────
   Category-Specific Question Configs
   ──────────────────────────────────────── */

export type QuestionField = {
    key: string;
    label: string;
    type: "text" | "number" | "select" | "date" | "time" | "textarea" | "toggle";
    placeholder?: string;
    options?: string[];
    required?: boolean;
};

const CATEGORY_QUESTIONS: Record<string, QuestionField[]> = {
    enfants: [
        { key: "num_children", label: "Number of children", type: "number", placeholder: "2", required: true },
        { key: "children_ages", label: "Children's ages", type: "text", placeholder: "3 years, 6 years", required: true },
        { key: "sitter_gender", label: "Preferred babysitter gender", type: "select", options: ["No preference", "Female", "Male"] },
        { key: "sitter_age_range", label: "Preferred babysitter age range", type: "select", options: ["No preference", "18-25", "25-35", "35-50", "50+"] },
        { key: "special_needs", label: "Special needs", type: "textarea", placeholder: "Allergies, disabilities, routines..." },
        { key: "duration", label: "Estimated duration (hours)", type: "number", placeholder: "4", required: true },
    ],
    menage: [
        { key: "home_size", label: "Home size (sqm)", type: "number", placeholder: "60", required: true },
        { key: "num_rooms", label: "Number of rooms", type: "number", placeholder: "3", required: true },
        { key: "cleaning_type", label: "Cleaning type", type: "select", options: ["Regular cleaning", "Deep cleaning", "Move-out cleaning", "Post-construction cleaning"], required: true },
        { key: "supplies_provided", label: "Are cleaning supplies provided?", type: "toggle" },
        { key: "pets", label: "Are there pets in the home?", type: "toggle" },
        { key: "frequency", label: "Frequency", type: "select", options: ["One-time", "Weekly", "Every two weeks", "Monthly"] },
    ],
    demenagement: [
        { key: "pickup_address", label: "Pickup address", type: "text", placeholder: "12 Grafton Street, Dublin", required: true },
        { key: "dropoff_address", label: "Drop-off address", type: "text", placeholder: "45 Patrick Street, Cork", required: true },
        { key: "pickup_floor", label: "Pickup floor", type: "number", placeholder: "3" },
        { key: "dropoff_floor", label: "Drop-off floor", type: "number", placeholder: "2" },
        { key: "elevator", label: "Is an elevator available?", type: "toggle" },
        { key: "volume", label: "Estimated volume (m³)", type: "number", placeholder: "20" },
        { key: "heavy_items", label: "Heavy items (piano, safe...)", type: "textarea", placeholder: "Describe any heavy items" },
        { key: "vehicle_needed", label: "Vehicle needed?", type: "select", options: ["No, I have a vehicle", "Yes, van", "Yes, truck"] },
    ],
    bricolage: [
        { key: "task_description", label: "Task description", type: "textarea", placeholder: "IKEA furniture assembly, tap repair...", required: true },
        { key: "tools_provided", label: "Are tools provided?", type: "toggle" },
        { key: "item_links", label: "Item links (if assembly)", type: "textarea", placeholder: "Paste links for items to assemble" },
        { key: "num_items", label: "Number of items to assemble", type: "number", placeholder: "2" },
        { key: "duration", label: "Estimated duration (hours)", type: "number", placeholder: "3", required: true },
    ],
    jardinage: [
        { key: "garden_size", label: "Garden size (sqm)", type: "number", placeholder: "100" },
        { key: "tasks", label: "Requested tasks", type: "select", options: ["Mowing", "Hedge trimming", "Weeding", "Planting", "Tree pruning", "Other"], required: true },
        { key: "tools_provided", label: "Are tools provided?", type: "toggle" },
        { key: "green_waste", label: "Green-waste removal needed?", type: "toggle" },
        { key: "duration", label: "Estimated duration (hours)", type: "number", placeholder: "3", required: true },
    ],
    informatique: [
        { key: "service_type", label: "Service type", type: "select", options: ["On-site", "Remote"], required: true },
        { key: "device_type", label: "Device type", type: "select", options: ["Windows PC", "Mac", "Smartphone", "Tablet", "Network/Wi-Fi", "Other"], required: true },
        { key: "issue_description", label: "Issue description", type: "textarea", placeholder: "Describe the issue in detail", required: true },
    ],
    "cours-particuliers": [
        { key: "subject", label: "Subject", type: "text", placeholder: "Maths, English...", required: true },
        { key: "student_level", label: "Student level", type: "select", options: ["Primary school", "Secondary school", "Leaving Certificate", "Higher education", "Adult"], required: true },
        { key: "student_age", label: "Student age", type: "number", placeholder: "14" },
        { key: "session_format", label: "Format", type: "select", options: ["In person", "Online", "Both"], required: true },
        { key: "frequency", label: "Preferred frequency", type: "select", options: ["One-time", "Weekly", "Every two weeks"] },
        { key: "session_duration", label: "Session duration (hours)", type: "number", placeholder: "1.5", required: true },
    ],
    animaux: [
        { key: "pet_type", label: "Pet type", type: "select", options: ["Dog", "Cat", "Small pet", "Bird", "Other"], required: true },
        { key: "num_pets", label: "Number of pets", type: "number", placeholder: "1", required: true },
        { key: "service_type", label: "Service type", type: "select", options: ["Walking", "Pet sitting", "Grooming", "Home visit"], required: true },
        { key: "special_needs", label: "Special needs", type: "textarea", placeholder: "Medication, diet, behaviour..." },
    ],
    "aide-domicile": [
        { key: "beneficiary_age", label: "Beneficiary age", type: "number", placeholder: "75" },
        { key: "mobility", label: "Mobility level", type: "select", options: ["Independent", "Light assistance", "Significant assistance", "Bed or wheelchair"], required: true },
        { key: "tasks", label: "Care types", type: "select", options: ["Companionship", "Shopping", "Meals", "Personal care", "Light cleaning", "Outing support"], required: true },
        { key: "frequency", label: "Frequency", type: "select", options: ["One-time", "Daily", "Weekly"], required: true },
        { key: "duration", label: "Visit duration (hours)", type: "number", placeholder: "3", required: true },
    ],
    hiver: [
        { key: "task_description", label: "Task description", type: "textarea", placeholder: "Snow clearing, chimney cleaning, window insulation...", required: true },
        { key: "tools_provided", label: "Are tools/materials provided?", type: "toggle" },
        { key: "duration", label: "Estimated duration (hours)", type: "number", placeholder: "2", required: true },
    ],
};

/* ────────────────────────────────────────
   ServiceQuestions Component
   ──────────────────────────────────────── */

interface ServiceQuestionsProps {
    categorySlug: string;
    answers: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export function ServiceQuestions({ categorySlug, answers, onChange }: ServiceQuestionsProps) {
    const questions = CATEGORY_QUESTIONS[categorySlug];

    if (!questions) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No specific questions are configured for this category.</p>
                <p className="text-sm mt-1">You can add extra details in the description.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Request details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                These details help providers understand what you need.
            </p>

            <div className="space-y-4">
                {questions.map((q) => (
                    <div key={q.key} className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {q.label}
                            {q.required && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>

                        {q.type === "text" || q.type === "number" ? (
                            <Input
                                type={q.type}
                                placeholder={q.placeholder}
                                value={answers[q.key] || ""}
                                onChange={(e) => onChange(q.key, e.target.value)}
                                className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                required={q.required}
                            />
                        ) : q.type === "date" ? (
                            <Input
                                type="date"
                                value={answers[q.key] || ""}
                                onChange={(e) => onChange(q.key, e.target.value)}
                                className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                required={q.required}
                            />
                        ) : q.type === "time" ? (
                            <Input
                                type="time"
                                value={answers[q.key] || ""}
                                onChange={(e) => onChange(q.key, e.target.value)}
                                className="rounded-xl border-gray-200 dark:border-gray-700 py-5"
                                required={q.required}
                            />
                        ) : q.type === "select" ? (
                            <select
                                value={answers[q.key] || ""}
                                onChange={(e) => onChange(q.key, e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-red-500"
                                required={q.required}
                            >
                                <option value="">Select...</option>
                                {q.options?.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : q.type === "textarea" ? (
                            <textarea
                                placeholder={q.placeholder}
                                value={answers[q.key] || ""}
                                onChange={(e) => onChange(q.key, e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:border-red-500 resize-none"
                                required={q.required}
                            />
                        ) : q.type === "toggle" ? (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => onChange(q.key, answers[q.key] === "yes" ? "no" : "yes")}
                                    className={`relative w-12 h-7 rounded-full ${answers[q.key] === "yes"
                                        ? "bg-red-600"
                                        : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow ${answers[q.key] === "yes" ? "translate-x-5" : ""
                                            }`}
                                    />
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {answers[q.key] === "yes" ? "Yes" : "No"}
                                </span>
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function getCategoryQuestions(slug: string): QuestionField[] {
    return CATEGORY_QUESTIONS[slug] || [];
}
