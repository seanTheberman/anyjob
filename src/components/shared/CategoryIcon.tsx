"use client";

import {
    AppWindow,
    Armchair,
    Baby,
    BookOpen,
    BookOpenText,
    BookText,
    Boxes,
    BriefcaseBusiness,
    BrushCleaning,
    Calculator,
    CalendarCheck,
    ChefHat,
    CheckCircle,
    CloudSnow,
    Construction,
    Dog,
    Drill,
    Droplets,
    Dumbbell,
    FlaskConical,
    Flower2,
    Frame,
    GraduationCap,
    Hammer,
    HandHeart,
    HeartHandshake,
    House,
    HouseHeart,
    Image,
    Languages,
    Laptop,
    LaptopMinimal,
    Leaf,
    MonitorCog,
    Music,
    Package,
    PackageOpen,
    PaintRoller,
    PawPrint,
    Pickaxe,
    PlugZap,
    Router,
    School,
    Scissors,
    Shirt,
    Shovel,
    Sofa,
    SprayCan,
    Sprout,
    SquareRadical,
    TreePine,
    Trees,
    Truck,
    Tv,
    Umbrella,
    Utensils,
    Wrench,
    type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    hiver: CloudSnow,
    bricolage: Hammer,
    jardinage: Leaf,
    demenagement: Truck,
    menage: SprayCan,
    enfants: Baby,
    animaux: PawPrint,
    informatique: MonitorCog,
    "aide-domicile": HouseHeart,
    "cours-particuliers": GraduationCap,
};

const SUBCATEGORY_ICONS: Record<string, LucideIcon> = {
    "menage-regulier": House,
    "home-cleaning-menage": House,
    "grand-menage": BrushCleaning,
    "deep-cleaning-menage": BrushCleaning,
    "nettoyage-vitres": SprayCan,
    "window-cleaning-menage": SprayCan,
    repassage: Shirt,
    "nettoyage-apres-travaux": Construction,
    "carpet-cleaning-menage": BrushCleaning,
    "move-cleaning-menage": PackageOpen,
    "office-cleaning-menage": BriefcaseBusiness,

    "petite-reparation": Wrench,
    "montage-meubles": Armchair,
    "furniture-assembly-bricolage": Armchair,
    "pose-etageres": Frame,
    "mount-art-bricolage": Image,
    "mount-tv-bricolage": Tv,
    peinture: PaintRoller,
    "painting-bricolage": PaintRoller,
    electricite: PlugZap,
    "electrical-bricolage": PlugZap,
    plomberie: Droplets,
    "plumbing-bricolage": Droplets,

    "tondre-pelouse": Scissors,
    "lawn-mowing-jardinage": Scissors,
    "taille-haies": Trees,
    desherbage: Sprout,
    "weeding-jardinage": Sprout,
    "ramassage-feuilles": Leaf,
    plantation: Flower2,
    "garden-maintenance-jardinage": Leaf,
    "landscaping-jardinage": Trees,
    "tree-trimming-jardinage": TreePine,

    "aide-demenagement": Boxes,
    "help-moving-demenagement": Boxes,
    transport: Truck,
    emballage: Package,
    "packing-demenagement": Package,
    "demontage-meubles": Drill,
    "furniture-moving-demenagement": Sofa,
    "heavy-lifting-demenagement": Dumbbell,

    babysitting: Baby,
    "babysitting-enfants": Baby,
    "sortie-ecole": School,
    "after-school-enfants": School,
    "garde-vacances": Umbrella,
    "aide-devoirs": BookOpenText,
    "nanny-enfants": HeartHandshake,

    "promenade-chien": Dog,
    "dog-walking-animaux": Dog,
    "garde-chien": PawPrint,
    "garde-chat": PawPrint,
    "visite-animaux": House,
    "pet-sitting-animaux": PawPrint,
    "pet-grooming-animaux": Scissors,

    "depannage-pc": LaptopMinimal,
    "computer-repair-informatique": LaptopMinimal,
    "installation-wifi": Router,
    "wifi-setup-informatique": Router,
    "cours-informatique": Laptop,
    "software-help-informatique": AppWindow,

    courses: Package,
    "grocery-shopping-aide": Package,
    "preparation-repas": Utensils,
    "meal-prep-aide": ChefHat,
    accompagnement: HandHeart,
    "companion-care-aide": HandHeart,
    lecture: BookOpen,

    maths: Calculator,
    "math-tutoring-cours": SquareRadical,
    francais: BookText,
    anglais: Languages,
    "language-tutoring-cours": Languages,
    musique: Music,
    "science-tutoring-cours": FlaskConical,

    "babysitting-hiver": Baby,
    "garde-vacances-hiver": CalendarCheck,
    "dog-sitting-hiver": PawPrint,
    "snow-removal-hiver": Shovel,
    "driveway-clearing-hiver": Shovel,
    "ice-removal-hiver": Pickaxe,
};

export function CategoryIcon({
    slug,
    className,
}: {
    slug: string;
    className?: string;
}) {
    const Icon = CATEGORY_ICONS[slug] ?? Hammer;
    return <Icon className={className ?? "w-6 h-6"} />;
}

export function SubcategoryIcon({
    slug,
    categorySlug,
    className,
}: {
    slug: string;
    categorySlug?: string;
    className?: string;
}) {
    const Icon = SUBCATEGORY_ICONS[slug] ?? (categorySlug ? CATEGORY_ICONS[categorySlug] : undefined) ?? CheckCircle;
    return <Icon className={className ?? "w-6 h-6"} />;
}
