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
        { key: "num_children", label: "Nombre d'enfants", type: "number", placeholder: "2", required: true },
        { key: "children_ages", label: "Âges des enfants", type: "text", placeholder: "3 ans, 6 ans", required: true },
        { key: "sitter_gender", label: "Genre du/de la baby-sitter préféré", type: "select", options: ["Pas de préférence", "Femme", "Homme"] },
        { key: "sitter_age_range", label: "Tranche d'âge du/de la baby-sitter", type: "select", options: ["Pas de préférence", "18-25 ans", "25-35 ans", "35-50 ans", "50+ ans"] },
        { key: "special_needs", label: "Besoins spéciaux", type: "textarea", placeholder: "Allergies, handicaps, routines particulières..." },
        { key: "duration", label: "Durée estimée (heures)", type: "number", placeholder: "4", required: true },
    ],
    menage: [
        { key: "home_size", label: "Surface du logement (m²)", type: "number", placeholder: "60", required: true },
        { key: "num_rooms", label: "Nombre de pièces", type: "number", placeholder: "3", required: true },
        { key: "cleaning_type", label: "Type de ménage", type: "select", options: ["Ménage régulier", "Grand ménage", "Ménage de sortie", "Après chantier"], required: true },
        { key: "supplies_provided", label: "Produits fournis ?", type: "toggle" },
        { key: "pets", label: "Animaux dans le logement ?", type: "toggle" },
        { key: "frequency", label: "Fréquence", type: "select", options: ["Ponctuel", "Hebdomadaire", "Bi-mensuel", "Mensuel"] },
    ],
    demenagement: [
        { key: "pickup_address", label: "Adresse de départ", type: "text", placeholder: "12 Rue de la Paix, Paris", required: true },
        { key: "dropoff_address", label: "Adresse d'arrivée", type: "text", placeholder: "45 Avenue des Champs, Lyon", required: true },
        { key: "pickup_floor", label: "Étage de départ", type: "number", placeholder: "3" },
        { key: "dropoff_floor", label: "Étage d'arrivée", type: "number", placeholder: "2" },
        { key: "elevator", label: "Ascenseur disponible ?", type: "toggle" },
        { key: "volume", label: "Volume estimé (m³)", type: "number", placeholder: "20" },
        { key: "heavy_items", label: "Objets lourds (piano, coffre-fort...)", type: "textarea", placeholder: "Décrivez les objets lourds" },
        { key: "vehicle_needed", label: "Véhicule nécessaire ?", type: "select", options: ["Non, j'ai un véhicule", "Oui, camionnette", "Oui, camion"] },
    ],
    bricolage: [
        { key: "task_description", label: "Description de la tâche", type: "textarea", placeholder: "Montage meuble IKEA, réparation robinet...", required: true },
        { key: "tools_provided", label: "Outils fournis ?", type: "toggle" },
        { key: "item_links", label: "Liens vers les articles (si montage)", type: "textarea", placeholder: "Collez les liens des meubles à monter" },
        { key: "num_items", label: "Nombre d'articles à monter", type: "number", placeholder: "2" },
        { key: "duration", label: "Durée estimée (heures)", type: "number", placeholder: "3", required: true },
    ],
    jardinage: [
        { key: "garden_size", label: "Taille du jardin (m²)", type: "number", placeholder: "100" },
        { key: "tasks", label: "Tâches souhaitées", type: "select", options: ["Tonte", "Taille de haie", "Désherbage", "Plantation", "Élagage", "Autre"], required: true },
        { key: "tools_provided", label: "Outils fournis ?", type: "toggle" },
        { key: "green_waste", label: "Évacuation des déchets verts ?", type: "toggle" },
        { key: "duration", label: "Durée estimée (heures)", type: "number", placeholder: "3", required: true },
    ],
    informatique: [
        { key: "service_type", label: "Type de prestation", type: "select", options: ["Sur place", "À distance"], required: true },
        { key: "device_type", label: "Type d'appareil", type: "select", options: ["PC Windows", "Mac", "Smartphone", "Tablette", "Réseau/WiFi", "Autre"], required: true },
        { key: "issue_description", label: "Description du problème", type: "textarea", placeholder: "Décrivez votre problème en détail", required: true },
    ],
    "cours-particuliers": [
        { key: "subject", label: "Matière", type: "text", placeholder: "Mathématiques, Français...", required: true },
        { key: "student_level", label: "Niveau de l'élève", type: "select", options: ["Primaire", "Collège", "Lycée", "Supérieur", "Adulte"], required: true },
        { key: "student_age", label: "Âge de l'élève", type: "number", placeholder: "14" },
        { key: "session_format", label: "Format", type: "select", options: ["En personne", "En ligne", "Les deux"], required: true },
        { key: "frequency", label: "Fréquence souhaitée", type: "select", options: ["Ponctuel", "Hebdomadaire", "Bi-mensuel"] },
        { key: "session_duration", label: "Durée par session (heures)", type: "number", placeholder: "1.5", required: true },
    ],
    animaux: [
        { key: "pet_type", label: "Type d'animal", type: "select", options: ["Chien", "Chat", "Rongeur", "Oiseau", "Autre"], required: true },
        { key: "num_pets", label: "Nombre d'animaux", type: "number", placeholder: "1", required: true },
        { key: "service_type", label: "Type de service", type: "select", options: ["Promenade", "Garde", "Toilettage", "Visite à domicile"], required: true },
        { key: "special_needs", label: "Besoins spéciaux", type: "textarea", placeholder: "Médicaments, régime alimentaire, comportement..." },
    ],
    "aide-domicile": [
        { key: "beneficiary_age", label: "Âge du bénéficiaire", type: "number", placeholder: "75" },
        { key: "mobility", label: "Niveau de mobilité", type: "select", options: ["Autonome", "Aide légère", "Aide importante", "Lit / fauteuil roulant"], required: true },
        { key: "tasks", label: "Types de soins", type: "select", options: ["Compagnie", "Courses", "Repas", "Toilette", "Ménage léger", "Accompagnement sorties"], required: true },
        { key: "frequency", label: "Fréquence", type: "select", options: ["Ponctuel", "Quotidien", "Hebdomadaire"], required: true },
        { key: "duration", label: "Durée par visite (heures)", type: "number", placeholder: "3", required: true },
    ],
    hiver: [
        { key: "task_description", label: "Description de la tâche", type: "textarea", placeholder: "Déneigement, ramonage, isolation fenêtres...", required: true },
        { key: "tools_provided", label: "Outils/matériel fourni ?", type: "toggle" },
        { key: "duration", label: "Durée estimée (heures)", type: "number", placeholder: "2", required: true },
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
                <p>Aucune question spécifique pour cette catégorie.</p>
                <p className="text-sm mt-1">Vous pouvez ajouter des détails dans la description.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Détails de votre demande
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Ces informations aideront les prestataires à mieux comprendre vos besoins.
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
                                <option value="">Sélectionner...</option>
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
                                    onClick={() => onChange(q.key, answers[q.key] === "oui" ? "non" : "oui")}
                                    className={`relative w-12 h-7 rounded-full ${answers[q.key] === "oui"
                                        ? "bg-red-600"
                                        : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow ${answers[q.key] === "oui" ? "translate-x-5" : ""
                                            }`}
                                    />
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {answers[q.key] === "oui" ? "Oui" : "Non"}
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
