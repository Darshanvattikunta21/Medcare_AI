// Inline symptom analyzer to avoid package resolution issues
// This is a direct copy from @medicare/core with minimal modifications

// Subset of medicines needed for analysis
const medicines = [
  { id: "paracetamol-650", name: "Paracetamol 650mg", brand: "GSK Pharma", price: "₹28" },
  { id: "vitamin-c-1000", name: "Vitamin C 1000mg", brand: "HealthVit", price: "₹120" },
  { id: "ors-sachets", name: "ORS Sachets", brand: "Electral", price: "₹38" },
  { id: "cough-syrup-100ml", name: "Cough Syrup 100ml", brand: "Benadryl", price: "₹65" },
  { id: "cetirizine-10", name: "Cetirizine 10mg", brand: "Cipla", price: "₹22" },
  { id: "ginger-turmeric", name: "Ginger & Turmeric Tea", brand: "Ayurveda Plus", price: "₹120" },
  { id: "levocetirizine-5", name: "Levocetirizine 5mg", brand: "Cipla", price: "₹35" },
  { id: "amoxicillin-500", name: "Amoxicillin 500mg", brand: "Sun Pharma", price: "₹85" },
  { id: "azithromycin-500", name: "Azithromycin 500mg", brand: "Macrolide", price: "₹95" },
  { id: "dolo-650", name: "Dolo 650mg", brand: "Micro Labs", price: "₹32" },
  { id: "ibuprofen-400", name: "Ibuprofen 400mg", brand: "Combiflam", price: "₹48" },
  { id: "aspirin-500", name: "Aspirin 500mg", brand: "Bayer", price: "₹45" },
  { id: "omeprazole-20", name: "Omeprazole 20mg", brand: "Cipla", price: "₹72" }
];

export type SymptomAnalysisInput = {
  symptoms?: string[];
  duration?: string;
  severity?: number;
  notes?: string;
};

export type SymptomAnalysisResult = {
  condition: string;
  confidence: string;
  matchedSymptoms: string[];
  warning: string;
  dosage: { label: string; value: string }[];
  safetyChecks: SymptomSafetyCheck[];
};

export type SymptomAnalysisSummary = {
  symptoms: string[];
  detectedSymptoms: string[];
  duration: string;
  severity: string;
  possibleConditions: string[];
  possibleDiseases: string[];
  medicines: string[];
  recommendedMedicines: string[];
  homeCare: string[];
  warnings: string[];
  consultDoctor: boolean;
  confidence: number;
};

export type SymptomAnalysisOutcome = {
  input: SymptomAnalysisInput;
  result: SymptomAnalysisResult;
  recommendedMedicines: any[];
  analysis: SymptomAnalysisSummary;
};

export type SymptomSafetyCheck = {
  type: "allergy" | "interaction" | "duplicate" | "general";
  message: string;
  medicineId?: string;
};

type DiseaseDefinition = {
  condition: string;
  name: string;
  patterns: string[];
  commonSymptoms: string[];
  baselineConfidence: number;
  warning: string;
  dosage: { label: string; value: string }[];
  recommendedMedicineIds: string[];
  homeCare: string[];
  matchedSymptoms?: string[];
};

const unknownSymptomProfile: DiseaseDefinition = {
  condition: "General Symptom Review",
  name: "General Symptom Review",
  patterns: [],
  commonSymptoms: [],
  baselineConfidence: 45,
  warning: "The symptoms are not specific enough for a reliable condition match. Monitor changes and seek medical advice if they worsen or persist.",
  dosage: [
    { label: "Advice", value: "Use OTC medicines only for clearly recognized symptoms and follow label directions." },
    { label: "Avoid", value: "Do not start antibiotics or prescription medicines without a clinician." }
  ],
  recommendedMedicineIds: [],
  homeCare: [
    "Rest and track symptoms with timing and temperature if available.",
    "Drink enough fluids and eat light meals.",
    "Seek care if new warning signs appear."
  ]
};

const diseaseKnowledgeBase: DiseaseDefinition[] = [
  {
    condition: "Viral Fever",
    name: "Viral Fever",
    patterns: ["fever", "body pain", "chills", "fatigue", "headache", "temperature", "viral"],
    commonSymptoms: ["fever", "headache", "body pain", "fatigue", "chills"],
    baselineConfidence: 90,
    warning: "Monitor fever closely and consult a doctor if it exceeds 103°F, persists beyond 3 days, or you develop weakness or confusion.",
    dosage: [
      { label: "Dosage", value: "1-2 tablets every 6-8 hours" },
      { label: "Duration", value: "Use for 3-5 days unless symptoms worsen" },
      { label: "Avoid", value: "Alcohol and duplicate paracetamol products" }
    ],
    recommendedMedicineIds: ["paracetamol-650", "vitamin-c-1000", "ors-sachets"],
    homeCare: [
      "Stay hydrated with water or ORS.",
      "Rest in a cool, well-ventilated room.",
      "Use a lukewarm sponge bath if fever is high.",
      "Avoid caffeine and alcohol while you recover."
    ]
  },
  {
    condition: "Common Cold & Cough",
    name: "Common Cold & Cough",
    patterns: ["cold", "cough", "sneezing", "runny nose", "nasal congestion", "sore throat"],
    commonSymptoms: ["cough", "cold", "runny nose", "sore throat", "sneezing"],
    baselineConfidence: 85,
    warning: "If cough persists for more than 2 weeks, or you develop chest pain or difficulty breathing, seek medical review.",
    dosage: [
      { label: "Dosage", value: "1-2 spoons of cough syrup three times daily" },
      { label: "Duration", value: "Use for 5-7 days" },
      { label: "Tips", value: "Stay hydrated and rest well." }
    ],
    recommendedMedicineIds: ["cough-syrup-100ml", "vitamin-c-1000", "cetirizine-10"],
    homeCare: [
      "Sip warm fluids and use steam inhalation for congestion.",
      "Keep your throat moist with warm drinks.",
      "Use a humidifier or breathe steam before bedtime."
    ]
  },
  {
    condition: "Flu-Like Illness",
    name: "Flu-Like Illness",
    patterns: ["flu", "influenza", "body ache", "muscle pain", "chills", "fatigue", "high temperature"],
    commonSymptoms: ["fever", "body pain", "fatigue", "chills", "headache"],
    baselineConfidence: 88,
    warning: "Flu-like illness can worsen quickly. Seek care if you develop chest pain, shortness of breath, or lightheadedness.",
    dosage: [
      { label: "Dosage", value: "1-2 tablets every 6-8 hours" },
      { label: "Duration", value: "Use for 5-7 days" },
      { label: "Advice", value: "Rest and hydrate aggressively." }
    ],
    recommendedMedicineIds: ["paracetamol-650", "ginger-turmeric", "vitamin-c-1000"],
    homeCare: [
      "Get adequate rest and avoid strenuous activity.",
      "Drink warm fluids and electrolyte drinks.",
      "Monitor breathing and oxygenation if possible."
    ]
  },
  {
    condition: "Allergic Rhinitis",
    name: "Allergic Rhinitis",
    patterns: ["allergy", "sneezing", "itchy eyes", "runny nose", "nasal congestion", "dust"],
    commonSymptoms: ["sneezing", "runny nose", "itchy eyes", "nasal congestion"],
    baselineConfidence: 80,
    warning: "Allergic symptoms are usually not dangerous, but consult a doctor if you develop wheezing or facial swelling.",
    dosage: [
      { label: "Dosage", value: "1 tablet once daily" },
      { label: "Duration", value: "Continue until allergen exposure decreases" },
      { label: "Avoid", value: "Avoid known allergens and dusty environments." }
    ],
    recommendedMedicineIds: ["levocetirizine-5", "cetirizine-10"],
    homeCare: [
      "Rinse nasal passages with saline solution.",
      "Keep windows closed during high pollen days.",
      "Use air purifiers and avoid allergens."
    ]
  },
  {
    condition: "Migraine & Severe Headache",
    name: "Migraine & Severe Headache",
    patterns: ["migraine", "severe headache", "throbbing", "one side", "light sensitivity", "nausea"],
    commonSymptoms: ["headache", "nausea", "light sensitivity"],
    baselineConfidence: 78,
    warning: "If headache is sudden, severe, or accompanied by weakness or vision changes, seek immediate medical attention.",
    dosage: [
      { label: "Dosage", value: "1-2 tablets at first sign of headache" },
      { label: "Duration", value: "Repeat every 4-6 hours if needed, max 3 times daily" },
      { label: "Avoid", value: "Avoid bright lights and loud noises." }
    ],
    recommendedMedicineIds: ["ibuprofen-400", "aspirin-500"],
    homeCare: [
      "Rest in a dark, quiet room.",
      "Apply a cold compress to your forehead.",
      "Stay hydrated and avoid trigger foods."
    ]
  },
  {
    condition: "Gastroenteritis",
    name: "Gastroenteritis",
    patterns: ["diarrhea", "vomiting", "nausea", "abdominal pain", "stomach cramps", "loose motion"],
    commonSymptoms: ["nausea", "vomiting", "diarrhea", "abdominal pain"],
    baselineConfidence: 83,
    warning: "Persistent vomiting or diarrhea for more than 24 hours requires medical review to prevent dehydration.",
    dosage: [
      { label: "Dosage", value: "Small frequent sips of ORS or electrolyte drink" },
      { label: "Duration", value: "Use until hydration is restored" },
      { label: "Avoid", value: "Avoid spicy and fatty foods until symptoms ease." }
    ],
    recommendedMedicineIds: ["ors-sachets", "vitamin-c-1000"],
    homeCare: [
      "Sip clear fluids steadily.",
      "Eat bland foods like rice and toast when able.",
      "Avoid dairy and greasy meals."
    ]
  },
  {
    condition: "Acid Reflux & Indigestion",
    name: "Acid Reflux & Indigestion",
    patterns: ["acid", "reflux", "heartburn", "indigestion", "stomach pain", "GERD"],
    commonSymptoms: ["indigestion", "heartburn", "stomach pain"],
    baselineConfidence: 75,
    warning: "If you experience chest pain or vomiting blood, seek immediate medical attention.",
    dosage: [
      { label: "Dosage", value: "1 tablet once daily before breakfast" },
      { label: "Duration", value: "Take for 7-14 days as needed" },
      { label: "Avoid", value: "Avoid spicy, fatty, and late-night meals." }
    ],
    recommendedMedicineIds: ["omeprazole-20", "vitamin-c-1000"],
    homeCare: [
      "Eat smaller meals more frequently.",
      "Avoid lying down immediately after eating.",
      "Elevate the head of the bed at night."
    ]
  }
];

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function formatSymptomName(value: string) {
  const normalized = normalizeText(value);
  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : "";
}

function getMedicinesByIds(ids: string[]) {
  return medicines.filter((item: any) => ids.includes(item.id));
}

function findSymptomProfile(text: string, symptoms: string[]) {
  const normalizedText = normalizeText(text);
  const normalizedSymptoms = symptoms.map(normalizeText);
  const scored = diseaseKnowledgeBase.map((item) => {
    const matchedPatterns = item.patterns.filter((pattern) =>
      normalizedText.includes(pattern) || normalizedSymptoms.some((symptom) => symptom.includes(pattern))
    );
    const score =
      matchedPatterns.length * 2 +
      item.commonSymptoms.filter((symptom) => normalizedSymptoms.includes(normalizeText(symptom))).length;
    return { item, score, matchedPatterns };
  });

  const bestMatch = scored.sort((a, b) => b.score - a.score)[0];
  return bestMatch && bestMatch.score > 0 ? bestMatch.item : unknownSymptomProfile;
}

function getPossibleConditions(text: string, symptoms: string[]) {
  const normalizedText = normalizeText(text);
  const scored = diseaseKnowledgeBase.map((item) => {
    const score = item.patterns.reduce((acc, pattern) => {
      if (normalizedText.includes(pattern)) {
        return acc + 2;
      }
      return acc + (symptoms.some((symptom) => normalizeText(symptom).includes(pattern)) ? 1 : 0);
    }, 0);
    return { condition: item.name, score };
  });

  const matches = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.condition);

  return matches.length > 0 ? matches : [unknownSymptomProfile.name];
}

function parseDuration(source: string) {
  const normalized = normalizeText(source);

  if (/\b(2\s*\+\s*weeks|two\s*\+?\s*weeks|14\s*days|fortnight)\b/.test(normalized)) {
    return "2+ weeks";
  }
  if (/\b(1\s*week|one\s*week|7\s*days)\b/.test(normalized)) {
    return "1 week";
  }
  if (/\b(1\s*day|one\s*day|today|today's|yesterday)\b/.test(normalized)) {
    return "1 day";
  }
  if (/\b(\d+)\s*days?\b/.test(normalized)) {
    const days = Number(normalized.match(/\b(\d+)\s*days?\b/)?.[1]);
    if (days >= 7) {
      return "2+ weeks";
    }
    if (days === 1) {
      return "1 day";
    }
    return "2-3 days";
  }

  return "2-3 days";
}

function classifySeverity(text: string, fallback = 5) {
  const normalized = normalizeText(text);

  if (/\b(very\s+severe|severe|terrible|excruciating|unbearable)\b/.test(normalized)) {
    return 9;
  }
  if (/\b(moderate|noticeable|significant|strong)\b/.test(normalized)) {
    return 6;
  }
  if (/\b(mild|slight|low|minor)\b/.test(normalized)) {
    return 3;
  }
  return fallback;
}

function normalizeSeverity(value: unknown, notes: string) {
  const parsed = typeof value === "number" ? value : Number(value);
  const fallback = Number.isFinite(parsed) ? parsed : classifySeverity(notes, 5);
  return Math.max(1, Math.min(10, Math.round(fallback)));
}

function extractSymptomsFromText(notes: string, selectedSymptoms: string[]) {
  const text = normalizeText(notes);
  const candidates = new Set<string>(selectedSymptoms.map(formatSymptomName).filter(Boolean));
  const aliases: Array<[RegExp, string]> = [
    [/\bbody\s+(ache|aches|pain|pains)\b/, "Body pain"],
    [/\bhead\s*(ache|pain)\b/, "Headache"],
    [/\bhigh\s+temperature\b/, "Fever"],
    [/\brunny\s+nose\b/, "Runny nose"],
    [/\bsore\s+throat\b/, "Sore throat"]
  ];

  aliases.forEach(([pattern, symptom]) => {
    if (pattern.test(text)) {
      candidates.add(symptom);
    }
  });

  diseaseKnowledgeBase.forEach((condition) => {
    condition.patterns.forEach((pattern) => {
      if (text.includes(pattern)) {
        const formatted = formatSymptomName(pattern);
        candidates.add(formatted);
      }
    });
  });

  return Array.from(candidates).map((symptom) => symptom.charAt(0).toUpperCase() + symptom.slice(1));
}

function buildHomeCareRecommendations(profile: { condition: string; homeCare?: string[] }, duration: string) {
  const recommendations = new Set<string>(
    profile.homeCare ?? [
      "Stay hydrated with water or ORS.",
      "Rest comfortably and avoid strenuous activity.",
      "Keep your environment cool and well-ventilated.",
      "Use simple home remedies like warm compresses and gentle stretching.",
      "Track symptoms and note any new warning signs."
    ]
  );

  if (profile.condition.toLowerCase().includes("fever")) {
    recommendations.add("Use a lukewarm sponge bath or cooling measures for fever.");
    recommendations.add("Avoid caffeine and alcohol while you have a fever.");
  }

  if (profile.condition.toLowerCase().includes("cold") || profile.condition.toLowerCase().includes("cough")) {
    recommendations.add("Sip warm fluids and use steam inhalation for nasal congestion.");
  }

  if (profile.condition.toLowerCase().includes("acid reflux") || profile.condition.toLowerCase().includes("indigestion")) {
    recommendations.add("Avoid spicy, oily, or acidic foods until symptoms improve.");
  }

  if (duration === "2+ weeks") {
    recommendations.add("Long-lasting symptoms should be evaluated by a healthcare provider.");
  }

  return Array.from(recommendations).slice(0, 5);
}

function getDynamicWarning(condition: string, baseWarning: string, severity: number, duration: string): string {
  if (severity >= 8) {
    switch (condition) {
      case "Viral Fever":
        return "🚨 HIGH SEVERITY FEVER: Seek medical consultation immediately. High fever can indicate a serious underlying infection or complication.";
      case "Common Cold & Cough":
        return "🚨 SEVERE COUGH/COLD: High severity respiratory symptoms can indicate pneumonia, acute bronchitis, or severe respiratory distress. Consult a doctor urgently.";
      case "Flu-Like Illness":
        return "🚨 SEVERE FLU SYMPTOMS: High risk of complications (e.g., secondary infection). Seek medical advice within 24 hours.";
      case "Allergic Rhinitis":
      case "Seasonal Allergy":
        return "🚨 WARNING: Severe allergy symptoms detected. Monitor closely for signs of anaphylaxis (difficulty breathing, swallowing, or swelling). Seek emergency care if these occur.";
      case "Migraine & Severe Headache":
        return "🚨 ACUTE HEADACHE: Severe throbbing headache. If this is the worst headache of your life, or accompanied by stiff neck, fever, or confusion, seek emergency care immediately.";
      case "Gastroenteritis":
        return "🚨 SEVERE GASTROENTERITIS: High risk of severe dehydration and electrolyte imbalance. Seek intravenous rehydration therapy or clinical evaluation immediately.";
      case "Acid Reflux & Indigestion":
        return "🚨 WARNING: Severe chest burning or pain. Note that severe upper abdominal/chest pain can mimic cardiac events. Seek immediate medical care if chest pain radiates to your arm or jaw.";
      default:
        return `🚨 HIGH SEVERITY ALERT: Severe symptoms detected (${severity}/10). Consult a healthcare professional within 24 hours for a proper clinical evaluation.`;
    }
  }
  
  if (duration === "2+ weeks") {
    return `⚠️ CHRONIC SYMPTOMS: These symptoms have lasted for ${duration}. ${baseWarning}`;
  }

  return baseWarning;
}

function getDynamicDosage(baseDosage: { label: string; value: string }[], severity: number) {
  if (severity >= 8) {
    return [
      ...baseDosage,
      { label: "Caution", value: "Severe symptoms. Do not exceed recommended dosage; seek clinical evaluation." }
    ];
  }
  return baseDosage;
}

function buildGeneralWarnings(profile: { condition: string; warning: string }, severity: number, duration: string) {
  const baseWarning = getDynamicWarning(profile.condition, profile.warning, severity, duration);
  const warnings = [baseWarning];

  if (severity >= 8) {
    warnings.push("High severity symptoms should prompt prompt medical review.");
  }
  if (duration === "2+ weeks") {
    warnings.push("Symptoms lasting more than two weeks require clinical assessment.");
  }

  return warnings.filter(Boolean);
}

function shouldConsultDoctor(profile: { condition: string; warning?: string }, severity: number, duration: string) {
  return (
    severity >= 8 ||
    duration === "2+ weeks" ||
    /infection|suspected bacterial|flu-like|migraine|chest pain|difficulty breathing/i.test(profile.condition)
  );
}

function calculateConfidence(confidenceValue: number, severity: number, duration: string) {
  const parsed = Number(confidenceValue) || 70;
  let adjusted = parsed;
  if (severity >= 8 || duration === "2+ weeks") {
    adjusted = Math.min(100, adjusted + 5);
  }
  if (severity <= 3 && duration === "1 day") {
    adjusted = Math.max(50, adjusted - 5);
  }
  return adjusted;
}

function buildSafetyChecks(
  profile: { medications?: string[]; allergies?: string[] } = {},
  recommendedMedicines: any[],
  severity = 5,
  duration = "2-3 days"
): SymptomSafetyCheck[] {
  const allergies = (profile.allergies ?? []).map(normalizeText);
  const medications = (profile.medications ?? []).map(normalizeText);
  const checks: SymptomSafetyCheck[] = [];

  const allergyRules = [
    {
      allergy: "penicillin",
      medicineIds: ["amoxicillin-500"],
      message: "Avoid penicillin-related antibiotics when you have a penicillin allergy."
    }
  ];

  const interactionRules = [
    {
      medicineIds: ["amoxicillin-500", "azithromycin-500"],
      userMedPatterns: ["amlodipine", "metformin"],
      message: "This antibiotic may require additional monitoring with your current blood pressure or diabetes medications."
    },
    {
      medicineIds: ["paracetamol-650", "dolo-650"],
      userMedPatterns: ["dolo", "paracetamol", "acetaminophen"],
      message: "Avoid duplicate fever or pain medicines containing paracetamol. Maximum 3000mg per day."
    },
    {
      medicineIds: ["ibuprofen-400", "aspirin-500"],
      userMedPatterns: ["paracetamol", "dolo"],
      message: "Combining NSAIDs with paracetamol requires careful dosing. Take under medical supervision."
    },
    {
      medicineIds: ["ibuprofen-400", "aspirin-500"],
      userMedPatterns: ["warfarin", "aspirin"],
      message: "NSAIDs may increase bleeding risk with blood thinners. Consult your doctor before use."
    },
    {
      medicineIds: ["omeprazole-20"],
      userMedPatterns: ["metformin"],
      message: "Omeprazole may affect vitamin B12 absorption. Monitor levels if taking for extended periods."
    },
    {
      medicineIds: ["levocetirizine-5", "cetirizine-10"],
      userMedPatterns: ["alcohol"],
      message: "Avoid alcohol with antihistamines as it may cause drowsiness and impaired judgment."
    },
    {
      medicineIds: ["cough-syrup-100ml"],
      userMedPatterns: ["maois", "antidepressant"],
      message: "Some cough syrups may interact with certain antidepressants. Verify with your doctor."
    }
  ];

  recommendedMedicines.forEach((medicine: any) => {
    allergyRules.forEach((rule) => {
      if (allergies.includes(rule.allergy) && rule.medicineIds.includes(medicine.id)) {
        checks.push({ type: "allergy", medicineId: medicine.id, message: rule.message });
      }
    });

    interactionRules.forEach((rule) => {
      if (
        rule.medicineIds.includes(medicine.id) &&
        medications.some((med) => rule.userMedPatterns.some((pattern) => med.includes(pattern)))
      ) {
        checks.push({ type: "interaction", medicineId: medicine.id, message: rule.message });
      }
    });
  });

  if (recommendedMedicines.some((item) => item.id === "paracetamol-650") && medications.some((med) => /paracetamol|dolo|acetaminophen/.test(med))) {
    checks.push({
      type: "duplicate",
      message: "Your profile contains another paracetamol-based medicine. Avoid duplicate dosing unless your doctor advises otherwise."
    });
  }

  if (severity >= 8) {
    checks.push({
      type: "general",
      message: "⚠️ HIGH SEVERITY - Consult a healthcare professional within 24 hours for proper evaluation."
    });
  } else if (severity >= 6) {
    checks.push({
      type: "general",
      message: "Moderate severity - Monitor symptoms closely and consult a doctor if they worsen."
    });
  }

  if (duration === "2+ weeks") {
    checks.push({
      type: "general",
      message: "Symptoms persisting longer than two weeks require medical review and diagnosis."
    });
  } else if (duration === "1 week") {
    checks.push({
      type: "general",
      message: "Symptoms lasting a week - Please monitor and seek medical advice if not improving."
    });
  }

  return checks;
}

export function analyzeSymptomInput(
  payload: SymptomAnalysisInput,
  profile: { medications?: string[]; allergies?: string[] } = {}
): SymptomAnalysisOutcome {
  const selectedSymptoms = payload.symptoms?.map((symptom) => normalizeText(symptom)).filter(Boolean) ?? [];
  const notes = normalizeText(payload.notes);
  const parsedDuration = payload.duration ? normalizeText(payload.duration) : parseDuration(notes);
  const parsedSeverity = normalizeSeverity(payload.severity, notes);
  const extractedSymptoms = extractSymptomsFromText(notes, selectedSymptoms);
  const searchText = `${extractedSymptoms.join(" ")} ${notes}`.trim();

  const profileMatch = findSymptomProfile(searchText, extractedSymptoms);
  const recommendedMedicines = getMedicinesByIds(profileMatch.recommendedMedicineIds);
  const safetyChecks = buildSafetyChecks(profile, recommendedMedicines, parsedSeverity, parsedDuration);
  const confidenceNumber = calculateConfidence(profileMatch.baselineConfidence, parsedSeverity, parsedDuration);

  const analysis: SymptomAnalysisSummary = {
    symptoms: extractedSymptoms,
    detectedSymptoms: extractedSymptoms,
    duration: parsedDuration,
    severity: `${parsedSeverity}/10`,
    possibleConditions: getPossibleConditions(searchText, extractedSymptoms),
    possibleDiseases: getPossibleConditions(searchText, extractedSymptoms),
    medicines: recommendedMedicines.map((medicine: any) => medicine.name),
    recommendedMedicines: recommendedMedicines.map((medicine: any) => medicine.name),
    homeCare: buildHomeCareRecommendations(profileMatch, parsedDuration),
    warnings: buildGeneralWarnings(profileMatch, parsedSeverity, parsedDuration),
    consultDoctor: shouldConsultDoctor(profileMatch, parsedSeverity, parsedDuration),
    confidence: confidenceNumber
  };

  validateSymptomAnalysisSummary(analysis);

  return {
    input: {
      symptoms: extractedSymptoms,
      duration: parsedDuration,
      severity: parsedSeverity,
      notes: payload.notes
    },
    result: {
      condition: profileMatch.condition,
      confidence: `${confidenceNumber}%`,
      matchedSymptoms:
        extractedSymptoms.length > 0 ? extractedSymptoms : profileMatch.matchedSymptoms ?? profileMatch.commonSymptoms,
      warning: getDynamicWarning(profileMatch.condition, profileMatch.warning, parsedSeverity, parsedDuration),
      dosage: getDynamicDosage(profileMatch.dosage, parsedSeverity),
      safetyChecks
    },
    recommendedMedicines,
    analysis
  };
}

export function validateSymptomAnalysisSummary(analysis: SymptomAnalysisSummary) {
  const arrayFields: Array<keyof SymptomAnalysisSummary> = [
    "symptoms",
    "detectedSymptoms",
    "possibleConditions",
    "possibleDiseases",
    "medicines",
    "recommendedMedicines",
    "homeCare",
    "warnings"
  ];

  const invalidArrayField = arrayFields.find((field) => {
    const value = analysis[field];
    return !Array.isArray(value) || !value.every((item) => typeof item === "string");
  });

  if (
    invalidArrayField ||
    typeof analysis.duration !== "string" ||
    typeof analysis.severity !== "string" ||
    typeof analysis.consultDoctor !== "boolean" ||
    typeof analysis.confidence !== "number"
  ) {
    throw new Error("Symptom analyzer produced an invalid response schema.");
  }

  return analysis;
}
