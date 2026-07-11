// Multi-language categories data
export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  translations: Record<string, string>;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  color: string;
  translations: Record<string, string>; // language: name
  keywords: Record<string, string[]>; // language: keywords for search
  countries: string[]; // Available countries
  subcategories?: Subcategory[];
}

const LAUNCH_COUNTRY = "IE";
const LAUNCH_COUNTRIES = [LAUNCH_COUNTRY];

export const CATEGORIES: Category[] = [
  {
    id: "1",
    slug: "menage",
    name: "Cleaning",
    color: "#EC4899",
    translations: {
      fr: "Ménage",
      en: "Cleaning",
      es: "Limpieza",
      de: "Reinigung",
      it: "Pulizie",
      pt: "Limpeza",
      nl: "Schoonmaken",
      ar: "تنظيف",
      zh: "清洁",
      ja: "清掃",
      hi: "सफाई"
    },
    keywords: {
      fr: ["ménage", "nettoyage", "femme de ménage", "menage", "propreté", "entretien"],
      en: ["cleaning", "house cleaning", "maid", "housekeeper", "cleaner", "tidy"],
      es: ["limpieza", "limpiadora", "ordenar", "aseo", "casa limpia"],
      de: ["reinigung", "putzfrau", "saubermachen", "aufräumen", "hausmeister"],
      it: ["pulizie", "pulizie", "signora delle pulizie", "pulire", "domestica"],
      pt: ["limpeza", "empregada", "arrumar", "faxina", "caseiro"],
      nl: ["schoonmaken", "schoonmaak", "huishoudelijke hulp", "poetsen"],
      ar: ["تنظيف", "نظافة", "خادمة", "تنظيف المنزل"],
      zh: ["清洁", "打扫", "保洁", "清洁工", "家政"],
      ja: ["清掃", "掃除", "クリーニング", "ハウスキーパー", "清潔"],
      hi: ["सफाई", "सफाई करना", "नौकरानी", "घर साफ", "सफाईकर्मी"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "2",
    slug: "bricolage",
    name: "Handyman",
    color: "#F59E0B",
    translations: {
      fr: "Bricolage",
      en: "Handyman",
      es: "Fontanería",
      de: "Handwerker",
      it: "Fai da te",
      pt: "Serviços gerais",
      nl: "Klusjesman",
      ar: "أعمال يدوية",
      zh: "维修",
      ja: "修理",
      hi: "ठेकेदार"
    },
    keywords: {
      fr: ["bricolage", "bricoleur", "réparation", "dépannage", "artisan", "main d'oeuvre"],
      en: ["handyman", "repair", "fix", "maintenance", "diy", "craftsman"],
      es: ["fontanería", "reparación", "fontanero", "arreglo", "mantenimiento"],
      de: ["handwerker", "reparatur", "instellung", "wartung", "schreiner"],
      it: ["fai da te", "riparazione", "artigiano", "manutenzione", "riparatore"],
      pt: ["serviços gerais", "reparação", "pedreiro", "manutenção", "conserto"],
      nl: ["klusjesman", "reparatie", "onderhoud", "montage", "installatie"],
      ar: ["أعمال يدوية", "إصلاح", "صيانة", "نجار", "سباك"],
      zh: ["维修", "修理", "装修", "水电工", "木工"],
      ja: ["修理", "修繕", "メンテナンス", "大工", "配管工"],
      hi: ["ठेकेदार", "मरम्मत", "कारीगर", "निर्माण", "सुधार"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "3",
    slug: "jardinage",
    name: "Gardening",
    color: "#22C55E",
    translations: {
      fr: "Jardinage",
      en: "Gardening",
      es: "Jardinería",
      de: "Gartenarbeit",
      it: "Giardinaggio",
      pt: "Jardinagem",
      nl: "Tuinieren",
      ar: "بستنة",
      zh: "园艺",
      ja: "園芸",
      hi: "बागवानी"
    },
    keywords: {
      fr: ["jardinage", "jardinier", "pelouse", "tondre", "taille", "plantes"],
      en: ["gardening", "gardener", "lawn", "mowing", "plants", "landscape"],
      es: ["jardinería", "jardinero", "césped", "cortar", "plantas", "paisaje"],
      de: ["gartenarbeit", "gärtner", "rasen", "mähen", "pflanzen", "landschaft"],
      it: ["giardinaggio", "giardiniere", "prato", "tagliare", "piante", "paesaggio"],
      pt: ["jardinagem", "jardineiro", "grama", "cortar", "plantas", "paisagismo"],
      nl: ["tuinieren", "tuinman", "gazon", "maaien", "planten", "landschap"],
      ar: ["بستنة", "بستاني", "عشب", "قص", "نباتات", "مناظر طبيعية"],
      zh: ["园艺", "园丁", "草坪", "修剪", "植物", "景观"],
      ja: ["園芸", "庭師", "芝生", "刈り取り", "植物", "景観"],
      hi: ["बागवानी", "माली", "घास", "काटना", "पौधे", "बगीचा"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "4",
    slug: "demenagement",
    name: "Moving",
    color: "#8B5CF6",
    translations: {
      fr: "Déménagement",
      en: "Moving",
      es: "Mudanza",
      de: "Umzug",
      it: "Trasloco",
      pt: "Mudança",
      nl: "Verhuizing",
      ar: "نقل",
      zh: "搬家",
      ja: "引っ越し",
      hi: "बदली"
    },
    keywords: {
      fr: ["déménagement", "déménager", "transport", "cartons", "meubles", "camion"],
      en: ["moving", "relocation", "transport", "boxes", "furniture", "truck"],
      es: ["mudanza", "mudar", "transporte", "cajas", "muebles", "camión"],
      de: ["umzug", "umziehen", "transport", "kartons", "möbel", "lkw"],
      it: ["trasloco", "traslocare", "trasporto", "scatole", "mobili", "camion"],
      pt: ["mudança", "mudar", "transporte", "caixas", "móveis", "caminhão"],
      nl: ["verhuizing", "verhuizen", "transport", "dozen", "meubels", "vrachtwagen"],
      ar: ["نقل", "انتقال", "نقل أثاث", "صناديق", "أثاث", "شاحنة"],
      zh: ["搬家", "搬迁", "运输", "箱子", "家具", "卡车"],
      ja: ["引っ越し", "移転", "運送", "ダンボール", "家具", "トラック"],
      hi: ["बदली", "स्थानांतर", "परिवहन", "डिब्बे", "फर्नीचर", "ट्रक"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "5",
    slug: "enfants",
    name: "Childcare",
    color: "#F97316",
    translations: {
      fr: "Garde d'enfants",
      en: "Childcare",
      es: "Cuidado de niños",
      de: "Kinderbetreuung",
      it: "Babysitting",
      pt: "Cuidado de crianças",
      nl: "Kinderopvang",
      ar: "رعاية الأطفال",
      zh: "儿童看护",
      ja: "子育て",
      hi: "बच्चों की देखभाल"
    },
    keywords: {
      fr: ["garde d'enfants", "babysitting", "nounou", "crèche", "enfants", "bébé"],
      en: ["childcare", "babysitting", "nanny", "daycare", "children", "baby"],
      es: ["cuidado de niños", "babysitter", "niñera", "guardería", "niños", "bebé"],
      de: ["kinderbetreuung", "babysitting", "nanny", "kita", "kinder", "baby"],
      it: ["babysitting", "babysitter", "tata", "asilo", "bambini", "bambino"],
      pt: ["cuidado de crianças", "babysitter", "babá", "creche", "crianças", "bebê"],
      nl: ["kinderopvang", "babysitting", "oppas", "kinderdagverblijf", "kinderen", "baby"],
      ar: ["رعاية الأطفال", "مربية", "حضانة", "أطفال", "رضيع"],
      zh: ["儿童看护", "保姆", "托儿所", "孩子", "婴儿"],
      ja: ["子育て", "ベビーシッター", "保育園", "子供", "赤ちゃん"],
      hi: ["बच्चों की देखभाल", "बेबीसिटर", "नर्सरी", "बच्चे", "शिशु"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "6",
    slug: "animaux",
    name: "Pet care",
    color: "#14B8A6",
    translations: {
      fr: "Garde d'animaux",
      en: "Pet care",
      es: "Cuidado de mascotas",
      de: "Tierbetreuung",
      it: "Cura animali",
      pt: "Cuidado de animais",
      nl: "Dierenoppas",
      ar: "رعاية الحيوانات",
      zh: "宠物护理",
      ja: "ペットケア",
      hi: "पालतू देखभाल"
    },
    keywords: {
      fr: ["garde d'animaux", "petsitting", "chien", "chat", "animaux", "promenade"],
      en: ["pet care", "petsitting", "dog", "cat", "pets", "walking"],
      es: ["cuidado de mascotas", "perro", "gato", "mascotas", "paseo"],
      de: ["tierbetreuung", "hund", "katze", "haustiere", "spaziergang"],
      it: ["cura animali", "cane", "gatto", "animali", "passeggiata"],
      pt: ["cuidado de animais", "cão", "gato", "animais", "passeio"],
      nl: ["dierenoppas", "hond", "kat", "huisdieren", "wandelen"],
      ar: ["رعاية الحيوانات", "كلب", "قطة", "حيوانات", "نزهة"],
      zh: ["宠物护理", "狗", "猫", "宠物", "遛狗"],
      ja: ["ペットケア", "犬", "猫", "ペット", "散歩"],
      hi: ["पालतू देखभाल", "कुत्ता", "बिल्ली", "पालतू", "सैर"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "7",
    slug: "informatique",
    name: "IT Support",
    color: "#6366F1",
    translations: {
      fr: "Informatique",
      en: "IT Support",
      es: "Informática",
      de: "IT-Support",
      it: "Informatica",
      pt: "Informática",
      nl: "IT-ondersteuning",
      ar: "دعم فني",
      zh: "技术支持",
      ja: "ITサポート",
      hi: "आईटी समर्थन"
    },
    keywords: {
      fr: ["informatique", "dépannage", "ordinateur", "pc", "internet", "wifi"],
      en: ["it support", "computer", "pc", "internet", "wifi", "tech"],
      es: ["informática", "soporte técnico", "ordenador", "pc", "internet", "wifi"],
      de: ["it-support", "computer", "pc", "internet", "wifi", "technik"],
      it: ["informatica", "assistenza tecnica", "computer", "pc", "internet", "wifi"],
      pt: ["informática", "suporte técnico", "computador", "pc", "internet", "wifi"],
      nl: ["it-ondersteuning", "computer", "pc", "internet", "wifi", "techniek"],
      ar: ["دعم فني", "كمبيوتر", "جهاز", "إنترنت", "واي فاي"],
      zh: ["技术支持", "电脑", "计算机", "互联网", "无线网络"],
      ja: ["ITサポート", "コンピューター", "PC", "インターネット", "WiFi"],
      hi: ["आईटी समर्थन", "कंप्यूटर", "पीसी", "इंटरनेट", "वाईफाई"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "8",
    slug: "aide-domicile",
    name: "Home help",
    color: "#EF4444",
    translations: {
      fr: "Aide à domicile",
      en: "Home help",
      es: "Ayuda a domicilio",
      de: "Hilfe zu Hause",
      it: "Aiuto domestico",
      pt: "Ajuda em casa",
      nl: "Hulp thuis",
      ar: "مساعدة منزلية",
      zh: "居家帮助",
      ja: "在宅介護",
      hi: "घरेलू सहायता"
    },
    keywords: {
      fr: ["aide à domicile", "aide", "courses", "repas", "accompagnement", "personne âgée"],
      en: ["home help", "home care", "shopping", "meals", "companion", "elderly"],
      es: ["ayuda a domicilio", "ayuda", "compras", "comidas", "acompañamiento", "ancianos"],
      de: ["hilfe zu hause", "hilfe", "einkaufen", "mahlzeiten", "begleitung", "ältere"],
      it: ["aiuto domestico", "aiuto", "spesa", "pasti", "compagnia", "anziani"],
      pt: ["ajuda em casa", "ajuda", "compras", "refeições", "companhia", "idosos"],
      nl: ["hulp thuis", "hulp", "boodschappen", "maaltijden", "gezelschap", "ouderen"],
      ar: ["مساعدة منزلية", "مساعدة", "تسوق", "وجبات", "مرافقة", "كبار السن"],
      zh: ["居家帮助", "购物", "餐食", "陪伴", "老人"],
      ja: ["在宅介護", "買い物", "食事", "付き添い", "高齢者"],
      hi: ["घरेलू सहायता", "खरीदारी", "भोजन", "साथ", "बुजुर्ग"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "9",
    slug: "cours-particuliers",
    name: "Private tutoring",
    color: "#0EA5E9",
    translations: {
      fr: "Cours particuliers",
      en: "Private tutoring",
      es: "Clases particulares",
      de: "Nachhilfe",
      it: "Lezioni private",
      pt: "Aulas particulares",
      nl: "Bijles",
      ar: "دروس خصوصية",
      zh: "私人辅导",
      ja: "家庭教師",
      hi: "निजी ट्यूशन"
    },
    keywords: {
      fr: ["cours particuliers", "tutorat", "professeur", "maths", "français", "anglais"],
      en: ["private tutoring", "tutor", "teacher", "math", "english", "french"],
      es: ["clases particulares", "tutor", "profesor", "matemáticas", "inglés", "francés"],
      de: ["nachhilfe", "tutor", "lehrer", "mathe", "englisch", "französisch"],
      it: ["lezioni private", "tutor", "insegnante", "matematica", "inglese", "francese"],
      pt: ["aulas particulares", "tutor", "professor", "matemática", "inglês", "francês"],
      nl: ["bijles", "tutor", "leraar", "wiskunde", "engels", "frans"],
      ar: ["دروس خصوصية", "مدرس خصوصي", "رياضيات", "إنجليزي", "فرنسي"],
      zh: ["私人辅导", "家教", "老师", "数学", "英语", "法语"],
      ja: ["家庭教師", "チューター", "先生", "数学", "英語", "フランス語"],
      hi: ["निजी ट्यूशन", "ट्यूटर", "शिक्षक", "गणित", "अंग्रेजी", "फ्रेंच"]
    },
    countries: LAUNCH_COUNTRIES
  },
  {
    id: "10",
    slug: "hiver",
    name: "Winter services",
    color: "#60A5FA",
    translations: {
      fr: "Services d'hiver",
      en: "Winter services",
      es: "Servicios de invierno",
      de: "Winterdienste",
      it: "Servizi invernali",
      pt: "Serviços de inverno",
      nl: "Winterdiensten",
      ar: "خدمات الشتاء",
      zh: "冬季服务",
      ja: "冬季サービス",
      hi: "सर्दियों की सेवाएं"
    },
    keywords: {
      fr: ["hiver", "neige", "dégivrage", "chauffage", "isolation", "déneigement"],
      en: ["winter", "snow", "defrosting", "heating", "insulation", "snow removal"],
      es: ["invierno", "nieve", "deshielo", "calefacción", "aislamiento", "quitanieves"],
      de: ["winter", "schnee", "enteisen", "heizung", "isolierung", "schneeräumung"],
      it: ["inverno", "neve", "scongelamento", "riscaldamento", "isolamento", "rimozione neve"],
      pt: ["inverno", "neve", "descongelamento", "aquecimento", "isolamento", "remoção de neve"],
      nl: ["winter", "sneeuw", "ontdooien", "verwarming", "isolatie", "sneeuwruimen"],
      ar: ["شتاء", "ثلج", "إذابة الجليد", "تدفئة", "عزل", "إزالة الثلج"],
      zh: ["冬季", "雪", "除冰", "供暖", "保温", "除雪"],
      ja: ["冬", "雪", "除氷", "暖房", "断熱", "除雪"],
      hi: ["सर्दी", "बर्फ", "बर्फ हटाना", "हीटिंग", "इन्सुलेशन", "बर्फ हटाना"]
    },
    countries: LAUNCH_COUNTRIES
  }
];

// Language detection and configuration
export const SUPPORTED_LANGUAGES = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "nl", name: "Nederlands" },
  { code: "ar", name: "العربية" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "hi", name: "हिन्दी" }
];

// Get user's language and country (synchronous for simplicity)
export function getUserLanguageAndCountry(): { language: string; country: string } {
  // Server-side default
  if (typeof window === 'undefined') {
    return { language: 'en', country: LAUNCH_COUNTRY };
  }

  // Check for manually selected language
  const savedLang = localStorage.getItem('user_language');
  if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
    return { language: savedLang, country: LAUNCH_COUNTRY };
  }

  try {
    // Fallback to browser language while keeping the launch country fixed to Ireland.
    const browserLang = navigator.language.split('-')[0];

    // Check if language is supported
    const supportedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang);
    if (supportedLang) {
      return { language: browserLang, country: LAUNCH_COUNTRY };
    }
  } catch (error) {
    console.warn('Error detecting language:', error);
  }

  // Default to English
  return { language: 'en', country: LAUNCH_COUNTRY };
}

// Get categories filtered by user's language and country
export function getLocalizedCategories(): Category[] {
  const { language, country } = getUserLanguageAndCountry();
  
  return CATEGORIES.filter(category => 
    category.countries.includes(country) && 
    category.translations[language]
  ).map(category => ({
    ...category,
    name: category.translations[language] || category.name
  }));
}

// Search categories with multi-language support
export function searchCategories(query: string, language?: string): Category[] {
  if (!query.trim()) return getLocalizedCategories();
  
  const searchLanguage = language || getUserLanguageAndCountry().language;
  const queryLower = query.toLowerCase().trim();
  
  // Detect if user is typing English - simple heuristic
  const isEnglishQuery = /^[a-zA-Z\s]+$/.test(query) && 
    ['cleaning', 'handyman', 'gardening', 'moving', 'childcare', 'pet care', 'it support', 'home help', 'private tutoring', 'winter services'].includes(queryLower);
  
  // Search across ALL categories (not just localized ones) for better results
  const scoredCategories = CATEGORIES.map(category => {
    let score = 0;
    let matchType = '';
    
    // Check translated name for current language - highest priority
    const translatedName = category.translations[searchLanguage]?.toLowerCase() || '';
    if (translatedName === queryLower) {
      score += 100;
      matchType = 'exact-name';
    } else if (translatedName.includes(queryLower)) {
      score += 80;
      matchType = 'partial-name';
    }
    
    // Check original name - medium priority
    const originalName = category.name.toLowerCase();
    if (originalName === queryLower) {
      score += 60;
      matchType = 'exact-original';
    } else if (originalName.includes(queryLower)) {
      score += 40;
      matchType = 'partial-original';
    }
    
    // Check subcategories - lower priority
    const subcategoryMatches = category.subcategories?.filter((sub: Subcategory) => 
      sub.translations[searchLanguage]?.toLowerCase().includes(queryLower) ||
      sub.name.toLowerCase().includes(queryLower)
    ).length || 0;
    
    if (subcategoryMatches > 0) {
      score += subcategoryMatches * 20;
      matchType = matchType || 'subcategory';
    }
    
    // Bonus for English queries matching English names
    if (isEnglishQuery && category.translations.en?.toLowerCase().includes(queryLower)) {
      score += 30;
      matchType = 'english-match';
    }
    
    return { category, score, matchType };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(item => ({
    ...item.category,
    name: item.category.translations[searchLanguage] || item.category.name
  }));
  
  return scoredCategories;
}
