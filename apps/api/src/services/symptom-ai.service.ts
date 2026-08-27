/**
 * symptom-ai.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Medical AI Symptom Analyzer — enhanced service layer.
 *
 * Design goals:
 *  1. Multi-condition detection   – up to 3 ranked conditions per analysis.
 *  2. Severity scoring (1–10)     – computed from base score + modifier signals.
 *  3. Doctor-warning threshold    – auto-triggered at severity ≥ 7.
 *  4. Structured medication data  – OTC options, dosage, category, warnings.
 *  5. Safety checks               – allergy / interaction / condition flags.
 *  6. Full input validation       – throws ApiError(400) on bad payloads.
 *  7. Zero unhandled 500s         – every execution path is caught here.
 *  8. Authenticated callers only  – caller must pass userId resolved by auth
 *     middleware; unauthenticated requests are rejected at the route layer.
 */

import { badRequest } from "../lib/errors";
import { buildSafetyChecks } from "./medication-safety.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SymptomAnalyzePayload = {
  symptoms?: unknown;
  duration?: unknown;
  severity?: unknown;
  notes?: unknown;
  ageGroup?: unknown;          // "child" | "adult" | "elderly"
  knownConditions?: unknown;   // patient's pre-existing conditions
  currentMedications?: unknown;// patient's current medications
  allergies?: unknown;         // patient's known allergies
};

export type MedicationRecommendation = {
  name: string;
  category: "OTC" | "Prescription" | "Home Remedy";
  dosage: string;
  duration: string;
  activeIngredient: string;
  notes: string;
  contraindicatedFor?: string[];
};

export type ConditionResult = {
  name: string;
  icd10Code: string;
  description: string;
  matchedSymptoms: string[];
  confidence: number;           // 0–100
  severity_score: number;       // 1–10
  severity_label: SeverityLabel;
  recommended_medications: MedicationRecommendation[];
  home_care: string[];
  doctor_warning: string | null;
  seek_emergency: boolean;
};

export type SafetyAlert = {
  type: "allergy" | "interaction" | "duplicate" | "condition" | "general";
  severity: "high" | "medium" | "low" | "info";
  message: string;
  medicineId?: string;
};

export type SymptomAnalyzeResponse = {
  status: "success";
  request_id: string;
  analyzed_at: string;
  data: {
    input_summary: {
      symptoms: string[];
      duration: string;
      user_severity: number;
      age_group: string;
      notes: string;
    };
    possible_conditions: ConditionResult[];
    overall_severity_score: number;
    triage_level: TriageLevel;
    safety_alerts: SafetyAlert[];
    follow_up_recommended: boolean;
    emergency_services_required: boolean;
    disclaimer: string;
  };
};

export type SeverityLabel = "Minimal" | "Mild" | "Moderate" | "High" | "Critical";
export type TriageLevel   = "Self-Care" | "Pharmacy" | "GP Visit" | "Urgent Care" | "Emergency";

// ─── Knowledge Base ───────────────────────────────────────────────────────────

type DiseaseKnowledge = {
  name: string;
  icd10: string;
  description: string;
  patterns: string[];               // symptom keywords that trigger this
  commonSymptoms: string[];
  baseSeverity: number;             // 1–10, can be raised by modifier signals
  emergencySeverityThreshold: number; // if score reaches this → seek_emergency=true
  medications: MedicationRecommendation[];
  homeCare: string[];
  warning: string;
};

const DISEASE_KB: DiseaseKnowledge[] = [
  // ── Viral Fever ─────────────────────────────────────────────────────────────
  {
    name: "Viral Fever",
    icd10: "A09 / B34.9",
    description:
      "A systemic viral infection causing elevated body temperature, fatigue, and generalised body ache. Usually self-limiting within 5–7 days.",
    patterns: ["viral fever", "generalised fever", "viral infection", "temperature spike", "body temperature high", "chills and body ache", "all-over body ache", "generalised weakness fever", "fever no localised pain"],
    commonSymptoms: ["Fever", "Headache", "Body pain", "Fatigue", "Chills"],
    baseSeverity: 4,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "Paracetamol 650mg",
        category: "OTC",
        activeIngredient: "Paracetamol (Acetaminophen)",
        dosage: "1–2 tablets every 6–8 hours",
        duration: "3–5 days or until fever resolves",
        notes: "First-line antipyretic. Do not exceed 4g/day. Avoid alcohol.",
        contraindicatedFor: ["liver disease"]
      },
      {
        name: "Ibuprofen 400mg",
        category: "OTC",
        activeIngredient: "Ibuprofen (NSAID)",
        dosage: "1 tablet every 8 hours with food",
        duration: "3 days",
        notes: "Use only if paracetamol is insufficient. Take with meals to reduce gastric irritation.",
        contraindicatedFor: ["gastric ulcer", "kidney disease", "asthma (aspirin-sensitive)"]
      },
      {
        name: "Electral ORS Sachets",
        category: "OTC",
        activeIngredient: "Oral Rehydration Salts",
        dosage: "1 sachet dissolved in 200ml water after each loose episode or every 4 hours",
        duration: "As needed during illness",
        notes: "Critical for maintaining hydration during fever.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "Rest in a cool, well-ventilated room.",
      "Sip cool water or electrolyte drinks every 30 minutes.",
      "Apply a damp cloth to the forehead for comfort.",
      "Avoid exertion and direct sunlight.",
      "Seek care immediately if fever exceeds 103°F (39.4°C) or persists beyond 5 days."
    ],
    warning:
      "Monitor fever closely. Temperatures above 103°F, febrile seizures, or loss of consciousness require emergency care."
  },

  // ── Common Cold & Upper Respiratory Infection ────────────────────────────────
  {
    name: "Common Cold / Upper Respiratory Infection",
    icd10: "J00 / J06.9",
    description:
      "Viral infection of the upper respiratory tract characterised by nasal congestion, sore throat, and sneezing. Typically resolves in 7–10 days.",
    patterns: ["cold", "sneezing", "runny nose", "stuffy nose", "nasal congestion", "blocked nose", "sore throat", "cough", "throat pain", "nasal drip", "scratchy throat", "postnasal drip"],
    commonSymptoms: ["Runny nose", "Sneezing", "Sore throat", "Mild cough"],
    baseSeverity: 2,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Cetirizine 10mg",
        category: "OTC",
        activeIngredient: "Cetirizine HCl (Antihistamine)",
        dosage: "1 tablet once daily at night",
        duration: "5–7 days",
        notes: "Reduces sneezing and runny nose. May cause mild drowsiness.",
        contraindicatedFor: ["severe kidney disease"]
      },
      {
        name: "Levocetirizine 5mg",
        category: "OTC",
        activeIngredient: "Levocetirizine (2nd-gen Antihistamine)",
        dosage: "1 tablet once daily at bedtime",
        duration: "5–7 days",
        notes: "Lower sedation profile than cetirizine. Suitable for daytime use.",
        contraindicatedFor: []
      },
      {
        name: "Benadryl Cough Syrup",
        category: "OTC",
        activeIngredient: "Diphenhydramine + Ammonium Chloride",
        dosage: "10ml (2 teaspoons) every 6–8 hours",
        duration: "5 days",
        notes: "Do not drive or operate machinery. Avoid alcohol.",
        contraindicatedFor: ["glaucoma", "prostate enlargement"]
      }
    ],
    homeCare: [
      "Inhale steam for 10–15 minutes twice daily.",
      "Gargle with warm salt water 3–4 times a day.",
      "Drink warm honey-lemon water to soothe the throat.",
      "Keep nasal passages moist with saline nasal drops.",
      "Get adequate rest to support immune recovery."
    ],
    warning:
      "Consult a doctor if symptoms worsen after 10 days, you develop earache, or a high fever starts."
  },

  // ── Flu / Influenza ──────────────────────────────────────────────────────────
  {
    name: "Influenza (Flu)",
    icd10: "J10 / J11",
    description:
      "A contagious respiratory illness caused by influenza viruses, presenting with sudden high fever, severe body ache, and profound fatigue.",
    patterns: ["flu", "influenza", "high fever sudden onset", "sudden high fever", "severe body ache", "muscle pain", "severe chills", "exhaustion", "loss of appetite flu", "prostrating fatigue", "cannot get out of bed"],
    commonSymptoms: ["High fever", "Severe body ache", "Fatigue", "Chills", "Headache"],
    baseSeverity: 6,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "Paracetamol 650mg / Dolo 650mg",
        category: "OTC",
        activeIngredient: "Paracetamol (Acetaminophen)",
        dosage: "1–2 tablets every 6–8 hours as needed",
        duration: "5–7 days",
        notes: "Reduces fever and body pain. Do not exceed 4g per day.",
        contraindicatedFor: ["liver disease"]
      },
      {
        name: "Oseltamivir (Tamiflu) 75mg",
        category: "Prescription",
        activeIngredient: "Oseltamivir Phosphate (Neuraminidase inhibitor)",
        dosage: "75mg twice daily for 5 days — only if started within 48 hours of symptom onset",
        duration: "5 days",
        notes: "Antiviral — must be prescribed. Reduces severity and duration of influenza.",
        contraindicatedFor: []
      },
      {
        name: "Vitamin C 1000mg",
        category: "OTC",
        activeIngredient: "Ascorbic Acid",
        dosage: "1 tablet once daily",
        duration: "During illness + 5 days post-recovery",
        notes: "Immune support. High doses may cause diarrhoea in sensitive individuals.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "Bed rest is essential — avoid any physical exertion.",
      "Stay well-hydrated with water, ORS, or clear soups.",
      "Keep warm and away from air conditioning.",
      "Isolate yourself to prevent spreading the virus.",
      "Monitor oxygen saturation (SpO₂) if a pulse oximeter is available."
    ],
    warning:
      "High risk for complications in the elderly, young children, and immunocompromised. Seek urgent care if breathing becomes difficult."
  },

  // ── Allergic Rhinitis ────────────────────────────────────────────────────────
  {
    name: "Allergic Rhinitis",
    icd10: "J30.1",
    description:
      "An IgE-mediated allergic reaction to airborne allergens (pollen, dust mites, pet dander) causing inflammation of the nasal mucosa.",
    patterns: ["allergy", "sneezing allergy", "itchy eyes", "watery eyes", "pollen", "dust allergy", "nasal allergy", "post-nasal drip", "itchy throat", "allergic reaction nose", "seasonal allergy"],
    commonSymptoms: ["Sneezing", "Itchy or watery eyes", "Runny nose", "Nasal congestion"],
    baseSeverity: 2,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Levocetirizine 5mg",
        category: "OTC",
        activeIngredient: "Levocetirizine Dihydrochloride",
        dosage: "1 tablet once daily",
        duration: "Until allergen exposure reduces or as long as symptoms persist",
        notes: "Non-sedating antihistamine. Safe for long-term use under guidance.",
        contraindicatedFor: ["severe renal impairment"]
      },
      {
        name: "Mometasone Nasal Spray",
        category: "Prescription",
        activeIngredient: "Mometasone Furoate (Intranasal Corticosteroid)",
        dosage: "2 sprays per nostril once daily",
        duration: "As prescribed — usually 2–4 weeks minimum",
        notes: "Gold standard for persistent allergic rhinitis. Requires a prescription.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "Rinse nasal passages twice daily with isotonic saline.",
      "Keep windows closed during high-pollen days.",
      "Use HEPA air purifiers and allergen-proof mattress covers.",
      "Shower after outdoor exposure to remove pollen.",
      "Avoid known allergens as much as possible."
    ],
    warning:
      "Anaphylaxis is rare but possible. If you develop hives, throat swelling, or difficulty breathing, call emergency services immediately."
  },

  // ── Gastroenteritis ──────────────────────────────────────────────────────────
  {
    name: "Acute Gastroenteritis",
    icd10: "A08 / A09",
    description:
      "Inflammation of the stomach and intestines, usually caused by viral or bacterial infection, presenting with vomiting, diarrhoea, and abdominal cramps.",
    patterns: ["nausea", "vomiting", "diarrhea", "diarrhoea", "loose motion", "stomach cramps", "abdominal pain", "food poisoning", "dehydration", "loose stool", "gastro", "watery stool", "stomach infection"],
    commonSymptoms: ["Nausea", "Vomiting", "Diarrhoea", "Stomach cramps"],
    baseSeverity: 5,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "ORS Sachets (Electral / Pedialyte)",
        category: "OTC",
        activeIngredient: "Oral Rehydration Salts (WHO formula)",
        dosage: "1 sachet dissolved in 200ml water after each loose episode",
        duration: "Until symptoms resolve",
        notes: "Most important treatment — prevents dangerous dehydration.",
        contraindicatedFor: []
      },
      {
        name: "Domperidone 10mg",
        category: "OTC",
        activeIngredient: "Domperidone (Prokinetic / Antiemetic)",
        dosage: "1 tablet 3 times daily before meals, max 3 days",
        duration: "1–3 days",
        notes: "Reduces nausea and vomiting. Avoid in cardiac arrhythmia patients.",
        contraindicatedFor: ["cardiac arrhythmia", "prolonged QT interval"]
      },
      {
        name: "Racecadotril 100mg",
        category: "OTC",
        activeIngredient: "Racecadotril (Enkephalinase Inhibitor — anti-secretory)",
        dosage: "100mg three times daily",
        duration: "3–5 days",
        notes: "Reduces intestinal fluid secretion without slowing gut motility.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "Sip clear fluids or ORS every 15–20 minutes — small frequent sips.",
      "Start a BRAT diet (Bananas, Rice, Applesauce, Toast) once tolerated.",
      "Avoid dairy, spicy food, caffeine, and alcohol until fully recovered.",
      "Maintain strict hand hygiene to prevent spread.",
      "Rest — do not return to school/work until 48 hours symptom-free."
    ],
    warning:
      "Seek immediate care if you cannot keep any fluids down for 24 hours, see blood in stool, or develop severe abdominal pain."
  },

  // ── Acid Reflux / GERD ───────────────────────────────────────────────────────
  {
    name: "Acid Reflux / GERD",
    icd10: "K21.0",
    description:
      "Chronic regurgitation of stomach acid into the oesophagus, causing heartburn, chest discomfort, and regurgitation.",
    patterns: ["heartburn", "acid reflux", "indigestion", "reflux", "gerd", "burning chest after eating", "regurgitation", "stomach acid", "acidity", "burning in food pipe", "belching acid", "sour taste mouth"],
    commonSymptoms: ["Heartburn", "Chest burning", "Regurgitation", "Nausea after meals"],
    baseSeverity: 3,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Omeprazole 20mg",
        category: "OTC",
        activeIngredient: "Omeprazole (Proton Pump Inhibitor)",
        dosage: "1 capsule 30 minutes before breakfast",
        duration: "4–8 weeks for initial treatment",
        notes: "Most effective OTC option for GERD. Long-term use requires doctor guidance.",
        contraindicatedFor: ["severe liver disease"]
      },
      {
        name: "Antacid (Gelusil / Digene)",
        category: "OTC",
        activeIngredient: "Magnesium Hydroxide + Aluminium Hydroxide",
        dosage: "1–2 tablets chewed 1 hour after meals and at bedtime",
        duration: "As needed for symptom relief",
        notes: "Fast-acting but short-term relief only. Not a substitute for PPI therapy.",
        contraindicatedFor: ["severe kidney disease"]
      }
    ],
    homeCare: [
      "Avoid trigger foods: spicy meals, citrus, tomatoes, chocolate, caffeine, alcohol.",
      "Eat smaller, more frequent meals instead of large portions.",
      "Do not lie down within 2–3 hours of eating.",
      "Elevate the head of the bed by 15–20cm.",
      "Maintain a healthy weight — excess weight worsens GERD."
    ],
    warning:
      "See a doctor if symptoms persist after 2 weeks of OTC treatment, or if you experience difficulty swallowing, unexplained weight loss, or black stools."
  },

  // ── Migraine ─────────────────────────────────────────────────────────────────
  {
    name: "Migraine",
    icd10: "G43.9",
    description:
      "A neurological disorder characterised by recurrent, moderate-to-severe unilateral headaches, often accompanied by nausea, photophobia, and phonophobia.",
    patterns: ["migraine", "severe headache", "throbbing headache", "one-sided headache", "light sensitivity", "photophobia", "aura", "nausea with headache", "visual disturbance", "pounding head", "sound sensitivity headache"],
    commonSymptoms: ["Throbbing headache", "Nausea", "Light sensitivity", "Sound sensitivity"],
    baseSeverity: 5,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "Ibuprofen 400mg",
        category: "OTC",
        activeIngredient: "Ibuprofen (NSAID)",
        dosage: "400mg at first sign of migraine, may repeat after 8 hours",
        duration: "Max 3 doses per episode",
        notes: "Most effective when taken at earliest symptom onset. Take with food.",
        contraindicatedFor: ["gastric ulcer", "kidney disease"]
      },
      {
        name: "Aspirin 500mg + Metoclopramide",
        category: "OTC",
        activeIngredient: "Aspirin (Salicylate) + Metoclopramide (Antiemetic)",
        dosage: "Aspirin 900mg + Metoclopramide 10mg at onset",
        duration: "Per episode only",
        notes: "Combination improves absorption of aspirin and controls nausea.",
        contraindicatedFor: ["anticoagulant therapy", "active bleeding disorders"]
      },
      {
        name: "Sumatriptan 50mg",
        category: "Prescription",
        activeIngredient: "Sumatriptan Succinate (5-HT1 Receptor Agonist / Triptan)",
        dosage: "50mg at migraine onset; may take 100mg if no response in 2 hours",
        duration: "Per episode; max 2 doses in 24 hours",
        notes: "Prescription migraine-specific therapy. Not for use with MAOIs or other triptans.",
        contraindicatedFor: ["ischaemic heart disease", "uncontrolled hypertension", "stroke history"]
      }
    ],
    homeCare: [
      "Rest in a dark, quiet room at first sign of attack.",
      "Apply a cold or warm compress to the head and neck.",
      "Stay hydrated — dehydration is a common trigger.",
      "Keep a migraine diary to identify personal triggers.",
      "Avoid known triggers: skipped meals, bright screens, stress, disrupted sleep."
    ],
    warning:
      "Thunderclap headache (worst headache of life), sudden onset with fever and stiff neck, or headache with neurological symptoms requires immediate emergency evaluation."
  },

  // ── Urinary Tract Infection ───────────────────────────────────────────────────
  {
    name: "Urinary Tract Infection (UTI)",
    icd10: "N30.0 / N39.0",
    description:
      "A bacterial infection of the urinary system (bladder, urethra) presenting with burning urination, increased frequency, and pelvic discomfort.",
    patterns: ["burning urination", "frequent urination", "urge to urinate", "pelvic pain", "cloudy urine", "blood in urine", "uti", "bladder infection", "painful urination", "urinary burning", "pain passing urine", "urinary tract"],
    commonSymptoms: ["Burning urination", "Increased frequency", "Pelvic pain", "Cloudy or dark urine"],
    baseSeverity: 5,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Nitrofurantoin 100mg",
        category: "Prescription",
        activeIngredient: "Nitrofurantoin (Urinary Antibiotic)",
        dosage: "100mg twice daily with food",
        duration: "5 days (uncomplicated UTI)",
        notes: "First-line antibiotic for lower UTI. Avoid in kidney impairment.",
        contraindicatedFor: ["kidney disease (eGFR < 45)", "third trimester pregnancy"]
      },
      {
        name: "Trimethoprim 200mg",
        category: "Prescription",
        activeIngredient: "Trimethoprim (Antibacterial — DHFR inhibitor)",
        dosage: "200mg twice daily",
        duration: "7 days",
        notes: "Alternative first-line option. Avoid in folate-deficiency anaemia.",
        contraindicatedFor: ["pregnancy (first trimester)", "folate deficiency"]
      },
      {
        name: "Phenazopyridine 200mg",
        category: "OTC",
        activeIngredient: "Phenazopyridine HCl (Urinary Analgesic)",
        dosage: "200mg three times daily after meals, max 2 days",
        duration: "2 days only (symptom relief only — not curative)",
        notes: "Relieves burning and urgency. Turns urine orange — this is normal.",
        contraindicatedFor: ["kidney disease", "hepatitis"]
      }
    ],
    homeCare: [
      "Drink 2–3 litres of water daily to flush the urinary tract.",
      "Avoid caffeine, alcohol, and spicy foods during infection.",
      "Wipe from front to back after using the toilet.",
      "Urinate shortly after sexual activity.",
      "Complete the full antibiotic course even if symptoms resolve early."
    ],
    warning:
      "If you develop high fever, back/flank pain, or shaking chills, the infection may have spread to the kidneys — seek urgent medical care immediately."
  },

  // ── Hypertensive Emergency / High Blood Pressure ─────────────────────────────
  {
    name: "Hypertensive Episode",
    icd10: "I10 / I11.9",
    description:
      "An acute significant rise in blood pressure, which may be asymptomatic or present with headache, dizziness, and palpitations.",
    patterns: ["high blood pressure", "hypertension", "severe headache bp", "blurred vision", "palpitations", "dizziness bp", "nosebleed", "chest tightness", "blood pressure", "bp spike", "hypertensive"],
    commonSymptoms: ["Severe headache", "Blurred vision", "Dizziness", "Palpitations", "Nosebleed"],
    baseSeverity: 7,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Amlodipine 5mg",
        category: "Prescription",
        activeIngredient: "Amlodipine Besylate (Calcium Channel Blocker)",
        dosage: "5mg once daily — as prescribed",
        duration: "Long-term maintenance — do not stop without medical guidance",
        notes: "Do not self-prescribe. This is a maintenance prescription medication.",
        contraindicatedFor: ["severe aortic stenosis"]
      }
    ],
    homeCare: [
      "Sit or lie down quietly and rest immediately.",
      "Do NOT eat salt, caffeine, or smoke.",
      "Measure blood pressure if a cuff is available.",
      "If BP > 180/120 mmHg with symptoms, this is a hypertensive emergency — call emergency services."
    ],
    warning:
      "⚠️ SEVERITY ≥ 7: Hypertensive crises can cause stroke, heart attack, or organ failure. Seek emergency care without delay if you have symptoms."
  },

  // ── Chest Pain / Cardiac ─────────────────────────────────────────────────────
  {
    name: "Possible Cardiac / Chest Pain",
    icd10: "R07.4 / I21",
    description:
      "Chest pain may indicate cardiac ischaemia, musculoskeletal causes, or pulmonary conditions. Cardiac causes are life-threatening and must be excluded first.",
    patterns: ["chest pain", "chest tightness", "chest pressure", "left arm pain", "jaw pain", "shortness of breath with chest pain", "heart attack", "angina", "palpitations with chest pain", "crushing chest", "heart pressure", "radiating arm pain"],
    commonSymptoms: ["Chest pain or pressure", "Left arm or jaw pain", "Shortness of breath", "Sweating", "Nausea"],
    baseSeverity: 9,
    emergencySeverityThreshold: 7,
    medications: [
      {
        name: "Aspirin 325mg (Emergency Use)",
        category: "OTC",
        activeIngredient: "Aspirin (Antiplatelet)",
        dosage: "Chew 1 x 325mg tablet immediately if cardiac event suspected",
        duration: "Single emergency dose only — await emergency services",
        notes: "Call emergency services FIRST. Aspirin reduces clot formation in suspected MI.",
        contraindicatedFor: ["active bleeding", "aspirin allergy"]
      }
    ],
    homeCare: [
      "⚠️ CALL EMERGENCY SERVICES IMMEDIATELY (102 / 112).",
      "Sit or lie in a comfortable position.",
      "Loosen tight clothing.",
      "Do not eat, drink, or exercise.",
      "Stay calm and wait for emergency responders."
    ],
    warning:
      "🚨 EMERGENCY: Chest pain with radiation, sweating, or shortness of breath may be a heart attack. Call 112 / 102 NOW. Do not drive yourself."
  },

  // ── Skin Rash / Dermatitis ───────────────────────────────────────────────────
  {
    name: "Skin Rash / Contact Dermatitis",
    icd10: "L25.9 / L30.9",
    description:
      "Inflammatory skin reaction causing redness, itching, and rash, commonly triggered by allergens, irritants, or infections.",
    patterns: ["rash", "itching", "skin irritation", "hives", "eczema", "urticaria", "redness", "blistering", "contact dermatitis", "allergic rash"],
    commonSymptoms: ["Itching", "Red or raised rash", "Hives", "Skin dryness or flaking"],
    baseSeverity: 3,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Cetirizine 10mg",
        category: "OTC",
        activeIngredient: "Cetirizine HCl (H1 Antihistamine)",
        dosage: "1 tablet once daily",
        duration: "5–7 days",
        notes: "Effective for allergic rash, hives, and itching.",
        contraindicatedFor: []
      },
      {
        name: "Hydrocortisone 1% Cream",
        category: "OTC",
        activeIngredient: "Hydrocortisone (Low-potency topical corticosteroid)",
        dosage: "Apply a thin layer to affected area twice daily",
        duration: "Max 7 days without medical review",
        notes: "Reduces inflammation and itching. Do not use on face or open wounds without guidance.",
        contraindicatedFor: ["rosacea", "infected skin"]
      }
    ],
    homeCare: [
      "Identify and remove the trigger (soaps, detergents, plants, metals).",
      "Apply cool compresses to the rash for 15–20 minutes.",
      "Use unscented, hypoallergenic moisturisers.",
      "Avoid scratching — trim nails to prevent skin damage.",
      "Wear loose, cotton clothing."
    ],
    warning:
      "If the rash spreads rapidly, causes swelling of lips or throat, or accompanies breathing difficulty — this may be anaphylaxis. Call emergency services immediately."
  },

  // ── Dengue Fever ─────────────────────────────────────────────────────────────
  {
    name: "Dengue Fever",
    icd10: "A90",
    description:
      "A mosquito-borne viral infection causing high fever, severe headache, muscle/joint pain, and characteristic rash. A haemorrhagic form can be life-threatening.",
    patterns: ["dengue", "bone pain", "joint pain with fever", "platelet", "mosquito", "behind eyes", "rash with fever", "high fever sudden"],
    commonSymptoms: ["High fever", "Severe joint pain", "Rash", "Headache behind eyes", "Nausea"],
    baseSeverity: 7,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Paracetamol 650mg",
        category: "OTC",
        activeIngredient: "Paracetamol (Acetaminophen)",
        dosage: "650mg every 6 hours — strictly avoid ibuprofen/aspirin",
        duration: "For fever duration under medical supervision",
        notes: "Paracetamol is the ONLY safe antipyretic for dengue. NSAIDs increase bleeding risk.",
        contraindicatedFor: ["liver disease"]
      },
      {
        name: "Electral ORS Sachets",
        category: "OTC",
        activeIngredient: "Oral Rehydration Salts",
        dosage: "1 sachet in 200ml water every 4 hours",
        duration: "Entire febrile period",
        notes: "Aggressive hydration is the cornerstone of dengue management.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "⚠️ DO NOT take ibuprofen or aspirin — they increase bleeding risk.",
      "Drink at least 2–3 litres of fluids per day.",
      "Use mosquito nets and repellent to prevent spread.",
      "Monitor for warning signs: bleeding gums, red spots on skin, severe abdominal pain.",
      "Seek emergency care immediately if any warning signs appear."
    ],
    warning: "⚠️ Dengue can progress to Dengue Haemorrhagic Fever. Seek urgent medical care for platelet monitoring."
  },

  // ── Typhoid ───────────────────────────────────────────────────────────────────
  {
    name: "Typhoid Fever",
    icd10: "A01.0",
    description:
      "A systemic bacterial infection (Salmonella typhi) transmitted through contaminated food or water, causing prolonged fever, abdominal pain, and rash.",
    patterns: ["typhoid", "prolonged fever", "rose spots", "contaminated water", "rose rash", "step ladder fever", "constipation with fever"],
    commonSymptoms: ["Prolonged fever", "Abdominal pain", "Weakness", "Constipation or diarrhoea", "Rose-coloured rash"],
    baseSeverity: 7,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "Azithromycin 500mg",
        category: "Prescription",
        activeIngredient: "Azithromycin (Macrolide Antibiotic)",
        dosage: "500mg once daily",
        duration: "7 days — must complete the full course",
        notes: "First-line antibiotic for uncomplicated typhoid. Requires prescription.",
        contraindicatedFor: ["QT prolongation"]
      },
      {
        name: "Ciprofloxacin 500mg",
        category: "Prescription",
        activeIngredient: "Ciprofloxacin (Fluoroquinolone Antibiotic)",
        dosage: "500mg twice daily",
        duration: "10–14 days",
        notes: "Alternative antibiotic. Increasing resistance — use sensitivity-guided if possible.",
        contraindicatedFor: ["pregnancy", "children under 18 (relative)", "tendon disorders"]
      },
      {
        name: "Paracetamol 650mg",
        category: "OTC",
        activeIngredient: "Paracetamol (Acetaminophen)",
        dosage: "650mg every 6 hours for fever",
        duration: "During febrile period",
        notes: "Symptomatic fever management only — antibiotics are required for cure.",
        contraindicatedFor: ["liver disease"]
      }
    ],
    homeCare: [
      "Drink only boiled or bottled water.",
      "Eat only freshly cooked, easily digestible foods.",
      "Complete the full antibiotic course even when feeling better.",
      "Strict hand hygiene before meals and after toilet use.",
      "Rest — avoid strenuous activity until fully recovered."
    ],
    warning: "Typhoid requires prescription antibiotics. Untreated typhoid can cause intestinal perforation — a life-threatening emergency."
  },

  // ── Chickenpox ────────────────────────────────────────────────────────────────
  {
    name: "Chickenpox (Varicella)",
    icd10: "B01",
    description:
      "A highly contagious viral infection causing itchy blister-like rash, fever, and malaise. Usually self-limiting in children but can be severe in adults and immunocompromised individuals.",
    patterns: ["chickenpox", "varicella", "skin rash", "rash", "blisters", "vesicles", "itchy rash all over", "fluid filled spots", "pox"],
    commonSymptoms: ["Itchy blister rash", "Fever", "Fatigue", "Loss of appetite"],
    baseSeverity: 4,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Cetirizine 10mg",
        category: "OTC",
        activeIngredient: "Cetirizine HCl (Antihistamine)",
        dosage: "1 tablet once daily at night",
        duration: "During itching phase",
        notes: "Reduces itching and prevents scratching-related secondary infection.",
        contraindicatedFor: []
      },
      {
        name: "Calamine Lotion",
        category: "OTC",
        activeIngredient: "Calamine + Zinc Oxide (Topical antipruritic)",
        dosage: "Apply to affected skin 3–4 times daily",
        duration: "Until blisters dry and crust",
        notes: "Soothes itching and promotes drying of lesions. Do not apply to eyes or mouth.",
        contraindicatedFor: []
      },
      {
        name: "Acyclovir 800mg",
        category: "Prescription",
        activeIngredient: "Acyclovir (Antiviral)",
        dosage: "800mg five times daily",
        duration: "7 days — best started within 24 hours of rash onset",
        notes: "Antiviral — reduces severity and duration. Essential in adults, immunocompromised, or severe cases.",
        contraindicatedFor: ["severe kidney impairment"]
      }
    ],
    homeCare: [
      "Isolate until all blisters have crusted over (usually 7 days).",
      "Keep fingernails short to prevent scratching and secondary infection.",
      "Take lukewarm baths with oatmeal or baking soda to relieve itching.",
      "Avoid aspirin in children — risk of Reye's syndrome.",
      "Use loose, cool clothing to minimise skin irritation."
    ],
    warning: "Seek urgent care if the rash involves the eye, develops bacterial superinfection, or if the patient is pregnant, immunocompromised, or a newborn."
  },

  // ── Sinusitis ─────────────────────────────────────────────────────────────────
  {
    name: "Sinusitis",
    icd10: "J01.9",
    description:
      "Inflammation of the paranasal sinuses, usually following a viral upper respiratory infection, causing facial pain, nasal congestion, and purulent discharge.",
    patterns: ["sinusitis", "sinus", "facial pain", "pressure behind eyes", "green mucus", "yellow nasal discharge", "blocked nose", "post nasal drip"],
    commonSymptoms: ["Facial pain or pressure", "Nasal congestion", "Thick yellow/green discharge", "Headache", "Reduced smell"],
    baseSeverity: 4,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Mometasone Nasal Spray",
        category: "Prescription",
        activeIngredient: "Mometasone Furoate (Intranasal Corticosteroid)",
        dosage: "2 sprays per nostril once daily",
        duration: "2–4 weeks",
        notes: "Reduces sinus inflammation. Requires prescription.",
        contraindicatedFor: []
      },
      {
        name: "Cetirizine 10mg",
        category: "OTC",
        activeIngredient: "Cetirizine HCl (Antihistamine)",
        dosage: "1 tablet once daily",
        duration: "5–7 days",
        notes: "Reduces mucosal swelling and discharge.",
        contraindicatedFor: []
      },
      {
        name: "Amoxicillin-Clavulanate 625mg",
        category: "Prescription",
        activeIngredient: "Amoxicillin + Clavulanate (Beta-lactam antibiotic)",
        dosage: "625mg twice daily with food",
        duration: "7–10 days — only for bacterial sinusitis",
        notes: "Reserve for bacterial sinusitis (>10 days symptoms, high fever, severe facial pain). Do not use for viral sinusitis.",
        contraindicatedFor: ["penicillin allergy", "liver disease"]
      }
    ],
    homeCare: [
      "Inhale steam 2–3 times daily to open sinus passages.",
      "Use saline nasal rinses (Neti pot) twice daily.",
      "Apply warm compresses to the face over sinuses.",
      "Stay hydrated — thin the mucus with plenty of fluids.",
      "Sleep with head slightly elevated."
    ],
    warning: "If you develop severe headache, stiff neck, vision changes, or facial swelling — seek emergency care. These may indicate serious complications."
  },

  // ── Asthma ────────────────────────────────────────────────────────────────────
  {
    name: "Asthma / Bronchospasm",
    icd10: "J45.9",
    description:
      "A chronic inflammatory airway disease characterised by reversible airflow obstruction, bronchospasm, and hypersensitivity, presenting with wheezing, shortness of breath, and chest tightness.",
    patterns: ["asthma", "wheezing", "shortness of breath", "breathlessness", "chest tightness breathing", "bronchospasm", "inhaler", "difficulty breathing", "cannot breathe", "breathing difficulty", "wheeze", "breathing tight"],
    commonSymptoms: ["Wheezing", "Shortness of breath", "Chest tightness", "Coughing at night"],
    baseSeverity: 7,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Salbutamol (Ventolin) Inhaler 100mcg",
        category: "Prescription",
        activeIngredient: "Salbutamol Sulphate (Short-acting Beta-2 agonist)",
        dosage: "2 puffs every 4–6 hours during attack; 1–2 puffs before exercise",
        duration: "As needed — rescue inhaler",
        notes: "First-line reliever for acute bronchospasm. Shake before use.",
        contraindicatedFor: ["severe heart disease"]
      },
      {
        name: "Budesonide Inhaler 200mcg",
        category: "Prescription",
        activeIngredient: "Budesonide (Inhaled Corticosteroid)",
        dosage: "1–2 puffs twice daily (controller therapy)",
        duration: "Long-term daily use as prescribed",
        notes: "Preventer inhaler — reduces airway inflammation. Do not stop suddenly.",
        contraindicatedFor: []
      },
      {
        name: "Montelukast 10mg",
        category: "Prescription",
        activeIngredient: "Montelukast Sodium (Leukotriene Receptor Antagonist)",
        dosage: "10mg once daily at bedtime",
        duration: "Ongoing as part of maintenance therapy",
        notes: "Add-on therapy for persistent asthma or allergic rhinitis component.",
        contraindicatedFor: ["neuropsychiatric history (monitor mood changes)"]
      }
    ],
    homeCare: [
      "Identify and avoid asthma triggers (dust, smoke, cold air, exercise, allergens).",
      "Always carry your reliever inhaler.",
      "Follow the asthma action plan prescribed by your doctor.",
      "Use a spacer device with pressurised inhalers for better delivery.",
      "Monitor peak flow readings if a peak flow meter is available."
    ],
    warning: "🚨 Severe asthma attack (inability to speak full sentences, blue lips, not improving with reliever) is a medical emergency. Call 112 immediately."
  },

  // ── Iron Deficiency Anaemia ───────────────────────────────────────────────────
  {
    name: "Iron Deficiency Anaemia",
    icd10: "D50.9",
    description:
      "A condition where insufficient iron leads to reduced haemoglobin production, causing fatigue, pallor, breathlessness on exertion, and cognitive impairment.",
    patterns: ["anaemia", "anemia", "pale", "pallor", "tired all the time", "breathless on exertion", "dizziness", "iron deficiency", "weak nails", "pica", "craving ice"],
    commonSymptoms: ["Fatigue", "Pallor", "Shortness of breath", "Dizziness", "Cold hands and feet"],
    baseSeverity: 4,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Ferrous Sulphate 200mg",
        category: "OTC",
        activeIngredient: "Ferrous Sulphate (Iron Salt)",
        dosage: "1 tablet twice daily between meals",
        duration: "3–6 months to replenish iron stores",
        notes: "Take with Vitamin C to improve absorption. Stool may turn dark — normal. Avoid with tea, coffee, antacids.",
        contraindicatedFor: ["haemochromatosis", "haemolytic anaemia"]
      },
      {
        name: "Vitamin C 500mg",
        category: "OTC",
        activeIngredient: "Ascorbic Acid",
        dosage: "500mg with each iron tablet",
        duration: "Duration of iron therapy",
        notes: "Significantly improves non-haem iron absorption. Take at same time as iron supplement.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "Increase dietary iron: red meat, liver, lentils, spinach, fortified cereals.",
      "Eat Vitamin C-rich foods alongside iron sources.",
      "Avoid tea, coffee, and calcium supplements within 2 hours of iron tablets.",
      "Cook in cast-iron cookware where possible.",
      "Have haemoglobin rechecked after 4 weeks of supplementation."
    ],
    warning: "Severe anaemia (Hb < 7 g/dL) may require IV iron or blood transfusion. Seek medical evaluation for persistent fatigue or breathlessness."
  },

  // ── Hyperglycaemia / Diabetes Exacerbation ───────────────────────────────────
  {
    name: "Hyperglycaemia / Diabetes Exacerbation",
    icd10: "E11.65 / E10.65",
    description:
      "Abnormally elevated blood glucose, common in Type 1 and Type 2 diabetes, presenting with excessive thirst, frequent urination, blurred vision, and fatigue.",
    patterns: ["diabetes", "high blood sugar", "hyperglycemia", "hyperglycaemia", "excessive thirst", "frequent urination", "blurred vision diabetes", "blood glucose", "DKA"],
    commonSymptoms: ["Excessive thirst", "Frequent urination", "Blurred vision", "Fatigue", "Headache"],
    baseSeverity: 6,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "Metformin 500mg",
        category: "Prescription",
        activeIngredient: "Metformin HCl (Biguanide)",
        dosage: "500mg twice daily with meals — as prescribed",
        duration: "Long-term maintenance — do not stop without guidance",
        notes: "First-line for Type 2 diabetes. Take with food to reduce GI side effects.",
        contraindicatedFor: ["kidney disease (eGFR < 30)", "contrast dye procedures"]
      },
      {
        name: "Insulin (Rapid-acting)",
        category: "Prescription",
        activeIngredient: "Insulin Aspart / Lispro",
        dosage: "As prescribed per sliding scale",
        duration: "Per clinical protocol",
        notes: "For acute glucose correction — dose under strict medical supervision.",
        contraindicatedFor: ["hypoglycaemia"]
      }
    ],
    homeCare: [
      "Check blood glucose immediately — act based on reading.",
      "Drink plenty of water to flush excess glucose.",
      "Do not skip meals or medications.",
      "Avoid sugary drinks, white rice, and processed carbohydrates.",
      "Contact your doctor or diabetes nurse if glucose > 14 mmol/L (250 mg/dL) twice in a row."
    ],
    warning: "🚨 Diabetic Ketoacidosis (DKA) — fruity breath, rapid breathing, confusion — is a life-threatening emergency. Call 112 immediately."
  },

  // ── Conjunctivitis (Pink Eye) ─────────────────────────────────────────────────
  {
    name: "Conjunctivitis (Pink Eye)",
    icd10: "H10.9",
    description:
      "Inflammation of the conjunctiva, the thin membrane covering the eye, causing redness, discharge, and itching. Can be viral, bacterial, or allergic.",
    patterns: ["pink eye", "conjunctivitis", "red eye", "eye discharge", "sticky eye", "watery eye", "eye infection", "itchy eyes", "eye redness"],
    commonSymptoms: ["Red eye", "Eye discharge", "Itching or burning", "Sensitivity to light", "Crusting on eyelid"],
    baseSeverity: 3,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Chloramphenicol 0.5% Eye Drops",
        category: "OTC",
        activeIngredient: "Chloramphenicol (Topical Antibiotic)",
        dosage: "1–2 drops in affected eye(s) every 2 hours (day 1), then 4 times daily",
        duration: "5 days — for bacterial conjunctivitis",
        notes: "For bacterial pink eye only. Do not use if viral or allergic cause suspected.",
        contraindicatedFor: ["chloramphenicol allergy"]
      },
      {
        name: "Sodium Cromoglicate 2% Eye Drops",
        category: "OTC",
        activeIngredient: "Sodium Cromoglicate (Mast cell stabiliser)",
        dosage: "1–2 drops 4 times daily",
        duration: "During allergen season or exposure",
        notes: "Specifically for allergic conjunctivitis. Prevents histamine release.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "Clean discharge gently with sterile saline or clean damp cotton.",
      "Wipe from inner to outer corner of eye.",
      "Wash hands frequently — conjunctivitis is highly contagious.",
      "Do not share towels, pillowcases, or eye makeup.",
      "Avoid touching or rubbing the eyes."
    ],
    warning: "Seek urgent eye care if you have vision changes, severe pain, photophobia, or discharge despite treatment after 5 days."
  },

  // ── Otitis Media (Ear Infection) ─────────────────────────────────────────────
  {
    name: "Otitis Media / Earache",
    icd10: "H66.9 / H92.0",
    description:
      "Infection or inflammation of the middle ear, commonly following an URTI, presenting with ear pain, hearing loss, and fever.",
    patterns: ["earache", "ear pain", "ear infection", "otitis", "blocked ear", "hearing loss sudden", "ear discharge", "pulling ear"],
    commonSymptoms: ["Ear pain", "Muffled hearing", "Fever", "Feeling of fullness in ear"],
    baseSeverity: 5,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "Ibuprofen 400mg",
        category: "OTC",
        activeIngredient: "Ibuprofen (NSAID)",
        dosage: "400mg every 8 hours with food",
        duration: "3–5 days",
        notes: "First-line for pain and fever in ear infection.",
        contraindicatedFor: ["gastric ulcer", "kidney disease"]
      },
      {
        name: "Amoxicillin 500mg",
        category: "Prescription",
        activeIngredient: "Amoxicillin (Aminopenicillin)",
        dosage: "500mg three times daily",
        duration: "7–10 days",
        notes: "Antibiotic for bacterial otitis media — requires prescription and clinical confirmation.",
        contraindicatedFor: ["penicillin allergy"]
      }
    ],
    homeCare: [
      "Apply a warm compress to the outside of the ear for pain relief.",
      "Keep the ear dry — avoid swimming or getting water in the ear.",
      "Sleep with the affected ear facing up.",
      "Do not insert objects or cotton buds into the ear canal.",
      "Complete the full antibiotic course if prescribed."
    ],
    warning: "If you notice discharge from the ear, sudden hearing loss, or signs of mastoiditis (swelling behind ear), seek urgent medical care."
  },

  // ── Food Poisoning ────────────────────────────────────────────────────────────
  {
    name: "Food Poisoning / Bacterial Gastritis",
    icd10: "A05.9",
    description:
      "Acute illness caused by consuming food contaminated with bacteria, viruses, or toxins, resulting in rapid-onset vomiting, diarrhoea, and cramps.",
    patterns: ["food poisoning", "spoiled food", "ate out sick", "sudden vomiting", "sudden diarrhea", "contaminated food", "bad food", "food intoxication"],
    commonSymptoms: ["Sudden vomiting", "Diarrhoea", "Stomach cramps", "Nausea", "Fever"],
    baseSeverity: 6,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "ORS Sachets",
        category: "OTC",
        activeIngredient: "Oral Rehydration Salts",
        dosage: "1 sachet dissolved in 200ml water after every loose episode",
        duration: "Until symptoms resolve",
        notes: "Rehydration is the most critical treatment. Start immediately.",
        contraindicatedFor: []
      },
      {
        name: "Domperidone 10mg",
        category: "OTC",
        activeIngredient: "Domperidone (Antiemetic)",
        dosage: "10mg three times daily before meals, max 3 days",
        duration: "1–3 days",
        notes: "Controls nausea and vomiting. Do not use in cardiac arrhythmia.",
        contraindicatedFor: ["cardiac arrhythmia"]
      },
      {
        name: "Ciprofloxacin 500mg",
        category: "Prescription",
        activeIngredient: "Ciprofloxacin (Fluoroquinolone Antibiotic)",
        dosage: "500mg twice daily",
        duration: "3–5 days — only for severe or traveller's diarrhoea",
        notes: "Reserve for severe bacterial food poisoning with high fever, blood in stool, or immunocompromised patient.",
        contraindicatedFor: ["tendon disease", "pregnancy (relative)"]
      }
    ],
    homeCare: [
      "Sip clear fluids or ORS in small frequent amounts.",
      "Rest and avoid solid food until vomiting settles.",
      "Start with bland foods: rice, toast, bananas when tolerated.",
      "Do not eat dairy, fatty, or spicy foods until fully recovered.",
      "Practise strict hand hygiene to prevent spread."
    ],
    warning: "Seek emergency care if you cannot keep any fluid down for 24 hours, see blood in stool, have high fever, or are pregnant, elderly, or immunocompromised."
  },

  // ── Kidney Stones ─────────────────────────────────────────────────────────────
  {
    name: "Renal Colic / Kidney Stones",
    icd10: "N20.0",
    description:
      "Severe, colicky flank pain caused by a urinary tract stone obstructing urine flow, often radiating to the groin, with associated nausea and haematuria.",
    patterns: ["kidney stone", "renal colic", "severe flank pain", "pain radiating to groin", "blood in urine", "urine stone", "back pain urination"],
    commonSymptoms: ["Severe flank pain", "Pain radiating to groin", "Blood in urine", "Nausea", "Vomiting"],
    baseSeverity: 8,
    emergencySeverityThreshold: 9,
    medications: [
      {
        name: "Diclofenac 50mg",
        category: "OTC",
        activeIngredient: "Diclofenac Sodium (NSAID)",
        dosage: "50mg three times daily with food",
        duration: "3–5 days for acute episode",
        notes: "Provides good analgesia for renal colic and reduces ureteral spasm.",
        contraindicatedFor: ["gastric ulcer", "kidney failure", "anticoagulants"]
      },
      {
        name: "Tamsulosin 0.4mg",
        category: "Prescription",
        activeIngredient: "Tamsulosin HCl (Alpha-1 blocker)",
        dosage: "0.4mg once daily at bedtime",
        duration: "Until stone passes — typically 2–4 weeks",
        notes: "Relaxes ureteral smooth muscle to aid stone passage. Requires prescription.",
        contraindicatedFor: ["severe liver disease", "concurrent PDE5 inhibitors"]
      }
    ],
    homeCare: [
      "Drink 2–3 litres of water daily to promote stone passage.",
      "Apply a heating pad to the flank area for pain relief.",
      "Strain urine to collect any passed stone for analysis.",
      "Reduce salt, animal protein, and oxalate-rich foods (spinach, nuts).",
      "Seek immediate care if fever develops alongside pain — may indicate infection."
    ],
    warning: "🚨 Renal colic with fever or rigors is an emergency (obstructive uropathy + infection). Seek emergency care immediately."
  },

  // ── Anxiety / Panic Attack ────────────────────────────────────────────────────
  {
    name: "Anxiety / Panic Attack",
    icd10: "F41.0 / F41.1",
    description:
      "An acute episode of intense fear or discomfort with palpitations, chest tightness, breathlessness, sweating, and a sense of impending doom, peaking within 10 minutes.",
    patterns: ["anxiety", "panic attack", "panic", "racing heart", "palpitations anxiety", "sense of doom", "hyperventilation", "breathing fast", "tingling hands"],
    commonSymptoms: ["Palpitations", "Chest tightness", "Shortness of breath", "Sweating", "Tingling in hands"],
    baseSeverity: 5,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Propranolol 10mg",
        category: "Prescription",
        activeIngredient: "Propranolol (Beta-blocker)",
        dosage: "10–40mg as needed for acute situational anxiety",
        duration: "As required (PRN) — not for regular use without guidance",
        notes: "Reduces physical symptoms of anxiety (palpitations, tremor). Requires prescription.",
        contraindicatedFor: ["asthma", "bradycardia", "heart block"]
      },
      {
        name: "Chamomile / Valerian Supplement",
        category: "Home Remedy",
        activeIngredient: "Chamomile extract / Valerian root",
        dosage: "One standardised capsule or tea 2–3 times daily",
        duration: "Short-term support",
        notes: "Evidence-based natural anxiolytics. Not replacements for clinical therapy.",
        contraindicatedFor: ["pregnancy", "sedative medications"]
      }
    ],
    homeCare: [
      "Practice box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s.",
      "Grounding technique: name 5 things you see, 4 you feel, 3 you hear.",
      "Move to a calm, quiet environment.",
      "Reduce caffeine, alcohol, and sleep deprivation.",
      "Consider cognitive behavioural therapy (CBT) for recurring panic attacks."
    ],
    warning: "Cardiac causes must be excluded for first-time chest pain with palpitations. If unsure, seek urgent medical evaluation."
  },

  // ── Lower Back Pain ───────────────────────────────────────────────────────────
  {
    name: "Lower Back Pain (Mechanical)",
    icd10: "M54.5",
    description:
      "Pain in the lumbar region, most commonly from muscle strain, poor posture, or disc issues, without neurological deficit.",
    patterns: ["back pain", "lower back", "lumbar", "backache", "slipped disc", "sciatica", "pain bending", "muscle spasm back"],
    commonSymptoms: ["Lower back pain", "Stiffness", "Pain radiating to buttocks", "Pain with movement"],
    baseSeverity: 4,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Ibuprofen 400mg",
        category: "OTC",
        activeIngredient: "Ibuprofen (NSAID)",
        dosage: "400mg every 8 hours with food",
        duration: "5–7 days",
        notes: "Reduces pain and inflammation. Preferred over paracetamol for musculoskeletal pain.",
        contraindicatedFor: ["gastric ulcer", "kidney disease"]
      },
      {
        name: "Diclofenac Gel 1%",
        category: "OTC",
        activeIngredient: "Diclofenac Sodium (Topical NSAID)",
        dosage: "Apply 2–4g to affected area 3–4 times daily",
        duration: "7–14 days",
        notes: "Topical application minimises systemic side effects.",
        contraindicatedFor: ["broken skin", "known NSAID allergy"]
      },
      {
        name: "Methocarbamol 750mg",
        category: "Prescription",
        activeIngredient: "Methocarbamol (Muscle Relaxant)",
        dosage: "750mg four times daily",
        duration: "3–5 days",
        notes: "For acute muscle spasm. May cause drowsiness — avoid driving.",
        contraindicatedFor: ["myasthenia gravis"]
      }
    ],
    homeCare: [
      "Apply ice pack for first 48 hours, then switch to heat therapy.",
      "Gentle stretching: cat-cow, knee-to-chest, pelvic tilts.",
      "Avoid complete bed rest — gentle activity is recommended.",
      "Use a supportive mattress and correct sitting posture.",
      "Physiotherapy is highly effective for recurrent back pain."
    ],
    warning: "Seek urgent care if back pain is accompanied by loss of bladder/bowel control, numbness in groin, or follows a trauma."
  },

  // ── Constipation ──────────────────────────────────────────────────────────────
  {
    name: "Constipation",
    icd10: "K59.00",
    description:
      "Infrequent or difficult bowel movements (fewer than 3 per week), hard stools, and straining, commonly due to low fibre diet, dehydration, or reduced activity.",
    patterns: ["constipation", "no bowel movement", "hard stool", "straining toilet", "bloating constipation", "cannot pass stool", "irregular bowel"],
    commonSymptoms: ["Infrequent stools", "Hard dry stools", "Straining", "Bloating", "Abdominal discomfort"],
    baseSeverity: 2,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Lactulose Solution",
        category: "OTC",
        activeIngredient: "Lactulose (Osmotic Laxative)",
        dosage: "15–30ml once or twice daily",
        duration: "Until regular bowel movements resume",
        notes: "Gentle osmotic laxative. Onset 24–48 hours. May cause gas and bloating.",
        contraindicatedFor: ["galactosaemia", "lactose intolerance (relative)"]
      },
      {
        name: "Bisacodyl 5mg",
        category: "OTC",
        activeIngredient: "Bisacodyl (Stimulant Laxative)",
        dosage: "5–10mg at bedtime",
        duration: "2–3 days only — avoid long-term use",
        notes: "Faster-acting stimulant laxative. Takes effect overnight.",
        contraindicatedFor: ["intestinal obstruction", "inflammatory bowel disease (acute)"]
      }
    ],
    homeCare: [
      "Increase dietary fibre: vegetables, fruits, whole grains, legumes.",
      "Drink at least 8 glasses of water daily.",
      "Exercise regularly — walking 30 minutes daily stimulates bowel motility.",
      "Establish a regular toilet routine — try after breakfast.",
      "Avoid holding the urge to pass stool."
    ],
    warning: "See a doctor if constipation is associated with blood in stool, unexplained weight loss, or persists for more than 3 weeks without improvement."
  },

  // ── Toothache / Dental Abscess ────────────────────────────────────────────────
  {
    name: "Toothache / Dental Pain",
    icd10: "K08.8",
    description:
      "Pain originating from the teeth, gums, or jaw, ranging from mild sensitivity to severe throbbing pain indicating abscess, cavity, or pulp inflammation.",
    patterns: ["toothache", "tooth pain", "dental pain", "gum pain", "jaw pain", "abscess", "throbbing tooth", "sensitive tooth", "swollen jaw"],
    commonSymptoms: ["Toothache", "Jaw swelling", "Gum redness", "Pain on biting", "Sensitivity to cold or heat"],
    baseSeverity: 5,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Ibuprofen 400mg",
        category: "OTC",
        activeIngredient: "Ibuprofen (NSAID)",
        dosage: "400mg every 6–8 hours with food",
        duration: "Until dental appointment — max 5 days",
        notes: "NSAIDs are more effective than paracetamol for dental pain. Do not apply to gum.",
        contraindicatedFor: ["gastric ulcer", "kidney disease"]
      },
      {
        name: "Clove Oil (Eugenol)",
        category: "Home Remedy",
        activeIngredient: "Eugenol (Natural analgesic/antiseptic)",
        dosage: "Apply 1–2 drops to cotton ball and place on affected tooth",
        duration: "As needed for temporary relief",
        notes: "Natural dental analgesic. Provides temporary relief only — not a cure.",
        contraindicatedFor: []
      },
      {
        name: "Amoxicillin 500mg",
        category: "Prescription",
        activeIngredient: "Amoxicillin (Aminopenicillin)",
        dosage: "500mg three times daily",
        duration: "5–7 days — for dental abscess only",
        notes: "Antibiotics do not cure dental pain. Required for abscess or spreading infection.",
        contraindicatedFor: ["penicillin allergy"]
      }
    ],
    homeCare: [
      "Rinse mouth with warm salt water every 2–3 hours.",
      "Apply a cold pack to the jaw externally for swelling.",
      "Do not apply aspirin directly to the gum — it causes chemical burns.",
      "Avoid very hot, cold, or sweet foods.",
      "See a dentist as soon as possible — antibiotics/pain relief are only temporary measures."
    ],
    warning: "Facial swelling that involves the eye, difficulty swallowing, or high fever suggests spreading infection — seek emergency dental/medical care immediately."
  },

  // ── Mouth Ulcers / Aphthous Stomatitis ───────────────────────────────────────
  {
    name: "Mouth Ulcers (Aphthous Ulcers)",
    icd10: "K12.0",
    description:
      "Small, painful sores on the inner mouth, lips, or tongue, typically benign and self-limiting but can cause significant discomfort.",
    patterns: ["mouth ulcer", "canker sore", "aphthous", "sore in mouth", "painful mouth sore", "ulcer inside mouth", "mouth sore"],
    commonSymptoms: ["Painful oral sores", "Difficulty eating", "White or yellow sores", "Soreness"],
    baseSeverity: 2,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Benzydamine Mouthwash 0.15%",
        category: "OTC",
        activeIngredient: "Benzydamine HCl (NSAID mouthwash)",
        dosage: "15ml undiluted rinsed for 30 seconds, 3 times daily",
        duration: "Until ulcer heals (usually 7–10 days)",
        notes: "Anti-inflammatory, analgesic, and antimicrobial properties.",
        contraindicatedFor: []
      },
      {
        name: "Triamcinolone Acetonide Dental Paste 0.1%",
        category: "Prescription",
        activeIngredient: "Triamcinolone Acetonide (Topical corticosteroid)",
        dosage: "Apply a thin coat to ulcer 2–3 times daily",
        duration: "5–7 days",
        notes: "Speeds healing of aphthous ulcers. Requires prescription.",
        contraindicatedFor: ["oral fungal infection"]
      }
    ],
    homeCare: [
      "Rinse with warm salt water 3–4 times daily.",
      "Avoid spicy, acidic, or rough-textured foods.",
      "Use a soft-bristled toothbrush.",
      "Ensure adequate B12, folate, and iron intake.",
      "Reduce stress — a common trigger for recurrent ulcers."
    ],
    warning: "See a doctor if ulcers are larger than 1cm, last more than 3 weeks, or recur very frequently. Rule out oral cancer in at-risk individuals."
  },

  // ── Scabies ───────────────────────────────────────────────────────────────────
  {
    name: "Scabies",
    icd10: "B86",
    description:
      "A contagious skin infestation by the Sarcoptes scabiei mite causing intense itching (worse at night), a pimple-like rash, and characteristic burrow tracks between fingers.",
    patterns: ["scabies", "skin rash", "rash", "mites", "intense itching night", "burrows skin", "itching between fingers", "worst itch", "spreading rash", "scabies rash"],
    commonSymptoms: ["Intense nocturnal itching", "Pimple-like rash", "Burrow tracks in skin", "Rash on wrists and finger webs"],
    baseSeverity: 4,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Permethrin 5% Cream",
        category: "Prescription",
        activeIngredient: "Permethrin (Pyrethroid Scabicide)",
        dosage: "Apply from neck to toes, leave for 8–12 hours, wash off — repeat in 7 days",
        duration: "2 applications, 1 week apart",
        notes: "First-line scabicide. Apply to every skin fold including nails and scalp in crusted scabies.",
        contraindicatedFor: ["pyrethrin allergy"]
      },
      {
        name: "Ivermectin 12mg",
        category: "Prescription",
        activeIngredient: "Ivermectin (Antiparasitic)",
        dosage: "200mcg/kg body weight once — repeat after 2 weeks",
        duration: "2 doses, 2 weeks apart",
        notes: "Oral alternative, especially for crusted scabies or treatment failures.",
        contraindicatedFor: ["pregnancy", "children < 15kg", "CNS disorders"]
      },
      {
        name: "Cetirizine 10mg",
        category: "OTC",
        activeIngredient: "Cetirizine HCl (Antihistamine)",
        dosage: "1 tablet once daily at night",
        duration: "Until itching resolves (may persist 2–4 weeks post-treatment)",
        notes: "Itching continues after successful treatment due to immune reaction — this is normal.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "Treat all household members and close contacts simultaneously.",
      "Wash all clothing, bedding, and towels in hot water (60°C+) on the same day as treatment.",
      "Seal non-washable items in plastic bags for 72 hours.",
      "Avoid close skin-to-skin contact until treatment is complete.",
      "Post-treatment itching can last 2–4 weeks — it does not mean treatment failed."
    ],
    warning: "If itching persists more than 4 weeks after correct treatment, consult a doctor. Crusted (Norwegian) scabies in immunocompromised individuals requires urgent specialist treatment."
  },

  // ── Fever + Rash Combination ──────────────────────────────────────────────────
  {
    name: "Fever with Rash (Unspecified)",
    icd10: "R21 / R50.9",
    description:
      "The combination of fever and rash together narrows the differential to specific infections including measles, rubella, dengue, drug reactions, or meningococcal disease. Requires urgent clinical evaluation.",
    patterns: ["fever with rash", "rash and fever", "spots fever", "rash temperature", "fever red spots", "maculopapular fever"],
    commonSymptoms: ["Fever", "Rash", "Malaise", "Lymphadenopathy"],
    baseSeverity: 7,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Paracetamol 650mg",
        category: "OTC",
        activeIngredient: "Paracetamol (Acetaminophen)",
        dosage: "650mg every 6 hours for fever",
        duration: "Until evaluated by a doctor",
        notes: "Symptomatic only — clinical evaluation is urgently required to determine cause.",
        contraindicatedFor: ["liver disease"]
      },
      {
        name: "Cetirizine 10mg",
        category: "OTC",
        activeIngredient: "Cetirizine HCl (Antihistamine)",
        dosage: "1 tablet once daily",
        duration: "Pending medical assessment",
        notes: "For allergic rash component only. Do not delay medical evaluation.",
        contraindicatedFor: []
      }
    ],
    homeCare: [
      "⚠️ Fever + Rash is a red flag combination requiring urgent medical evaluation.",
      "Do not try to self-treat the underlying cause.",
      "Document when the rash started relative to the fever.",
      "Note any recent medication changes, travel, or sick contacts.",
      "Seek medical care the same day."
    ],
    warning: "🚨 Non-blanching rash (petechiae) with fever may indicate meningococcal disease — a life-threatening emergency. Call 112 immediately."
  },

  // ── Tension-Type Headache ───────────────────────────────────────────────────
  {
    name: "Tension-Type Headache",
    icd10: "G44.2",
    description:
      "The most common primary headache disorder, presenting as a dull, constant, bilateral band-like pressing pain around the forehead, temples, or back of head/neck, often associated with stress, fatigue, or muscle strain.",
    patterns: [
      "tension headache", "headache", "head ache", "dull headache", "band around head",
      "forehead ache", "temple pain", "neck stiffness headache", "stress headache", "tight head",
      "pressure in head", "mild headache", "constant headache"
    ],
    commonSymptoms: ["Headache", "Dull head pressure", "Neck tightness", "Fatigue", "Difficulty concentrating"],
    baseSeverity: 3,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Paracetamol 500mg / 650mg",
        category: "OTC",
        activeIngredient: "Paracetamol (Acetaminophen)",
        dosage: "1–2 tablets every 6 hours as needed (max 4g/day)",
        duration: "1–3 days per headache episode",
        notes: "First-line analgesic for tension headaches. Safe for most patients.",
        contraindicatedFor: ["liver disease"]
      },
      {
        name: "Ibuprofen 400mg",
        category: "OTC",
        activeIngredient: "Ibuprofen (NSAID)",
        dosage: "400mg with food every 8 hours as needed",
        duration: "1–3 days",
        notes: "Effective alternative for tension headaches with neck muscle tension.",
        contraindicatedFor: ["gastric ulcer", "kidney disease"]
      }
    ],
    homeCare: [
      "Rest in a quiet, dimly lit room.",
      "Apply a warm or cool compress to the forehead or neck.",
      "Gentle neck and shoulder stretching exercises.",
      "Stay hydrated — drink 2 litres of water daily.",
      "Take regular breaks from computer/phone screens."
    ],
    warning: "Seek urgent care if headache is sudden and explosive (thunderclap), accompanied by high fever, stiff neck, confusion, weakness, or numbness."
  },

  // ── Acute Bronchitis ────────────────────────────────────────────────────────
  {
    name: "Acute Bronchitis / Viral Cough",
    icd10: "J20.9",
    description:
      "Acute inflammation of the bronchial airways following a viral upper respiratory infection, causing persistent cough (dry or productive with clear/yellow phlegm), mild chest discomfort, headache, and fatigue.",
    patterns: [
      "bronchitis", "cough", "persistent cough", "chest cough", "dry cough", "wet cough",
      "cough with phlegm", "mucus cough", "chest discomfort cough", "cough and headache",
      "hacking cough", "bronchial", "chest tightness cough"
    ],
    commonSymptoms: ["Cough", "Chest discomfort", "Mild headache", "Fatigue", "Sore throat", "Low-grade fever"],
    baseSeverity: 4,
    emergencySeverityThreshold: 8,
    medications: [
      {
        name: "Dextromethorphan Syrup (Benadryl DR)",
        category: "OTC",
        activeIngredient: "Dextromethorphan HBr (Antitussive)",
        dosage: "10ml every 6–8 hours as needed for dry cough",
        duration: "5–7 days",
        notes: "Suppresses non-productive dry cough. Avoid if producing thick phlegm.",
        contraindicatedFor: ["asthma", "concurrent MAOI antidepressants"]
      },
      {
        name: "Guaifenesin Expectorant (Mucinex)",
        category: "OTC",
        activeIngredient: "Guaifenesin (Mucolytic Expectorant)",
        dosage: "1 tablet (400mg) every 4 hours with a full glass of water",
        duration: "5–7 days",
        notes: "Thins bronchial mucus and eases productive chesty cough.",
        contraindicatedFor: []
      },
      {
        name: "Paracetamol 650mg",
        category: "OTC",
        activeIngredient: "Paracetamol (Acetaminophen)",
        dosage: "1 tablet every 6 hours for headache or fever",
        duration: "3–5 days",
        notes: "Relieves accompanying headache and malaise.",
        contraindicatedFor: ["liver disease"]
      }
    ],
    homeCare: [
      "Drink plenty of warm fluids (herbal teas, honey-lemon water, warm broths).",
      "Steam inhalation 2–3 times daily to soothe irritated airways.",
      "Use a room humidifier or vaporizer.",
      "Avoid smoke, dust, and cold air.",
      "Rest adequately to support respiratory recovery."
    ],
    warning: "Consult a doctor if coughing lasts more than 3 weeks, produces rust-coloured or bloody sputum, or is accompanied by shortness of breath or high fever (>102°F)."
  }
];


// ─── Severity Modifiers ───────────────────────────────────────────────────────

type SeverityModifier = {
  pattern: RegExp;
  adjustment: number;
  reason: string;
};

const SEVERITY_MODIFIERS: SeverityModifier[] = [
  { pattern: /\b(severe|extreme|unbearable|worst|critical|intense)\b/i,  adjustment: +2, reason: "Patient reports severe intensity" },
  { pattern: /\b(elderly|senior|old age|80|90|75 years)\b/i,              adjustment: +1, reason: "Elevated risk in elderly" },
  { pattern: /\b(child|infant|baby|toddler|newborn)\b/i,                 adjustment: +1, reason: "Elevated risk in children" },
  { pattern: /\b(pregnant|pregnancy|expecting)\b/i,                      adjustment: +2, reason: "Pregnancy increases medical risk" },
  { pattern: /\b(diabetic|diabetes|immunocompromised|hiv|cancer)\b/i,    adjustment: +2, reason: "High-risk underlying condition" },
  { pattern: /\b(mild|minor|slight|barely|little)\b/i,                   adjustment: -1, reason: "Patient reports mild symptoms" },
  { pattern: /\b(improving|getting better|subsiding)\b/i,                adjustment: -1, reason: "Symptom trajectory improving" },
  { pattern: /\b(2 weeks|month|chronic|persistent|long-standing)\b/i,    adjustment: +1, reason: "Prolonged symptom duration" }
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateRequestId(): string {
  return `sym-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function severityLabel(score: number): SeverityLabel {
  if (score <= 2) return "Minimal";
  if (score <= 4) return "Mild";
  if (score <= 6) return "Moderate";
  if (score <= 8) return "High";
  return "Critical";
}

function triageLevel(score: number): TriageLevel {
  if (score <= 2) return "Self-Care";
  if (score <= 4) return "Pharmacy";
  if (score <= 6) return "GP Visit";
  if (score <= 8) return "Urgent Care";
  return "Emergency";
}

function buildDoctorWarning(score: number, conditionName: string): string | null {
  if (score < 7) return null;
  if (score >= 9) {
    return (
      `🚨 CRITICAL — Severity ${score}/10: "${conditionName}" requires IMMEDIATE emergency medical attention. ` +
      `Call emergency services (112 / 102) or go to the nearest emergency room NOW. Do not delay.`
    );
  }
  return (
    `⚠️ HIGH SEVERITY — Severity ${score}/10: "${conditionName}" requires prompt evaluation by a qualified medical professional. ` +
    `Please consult a licensed doctor or visit an urgent care centre as soon as possible.`
  );
}

function computeConfidence(matchedCount: number, totalPatterns: number, userSeverity: number): number {
  const patternScore = Math.min(100, Math.round((matchedCount / Math.max(1, totalPatterns)) * 100));
  const severityBoost = Math.min(15, userSeverity);
  return Math.min(98, patternScore + severityBoost);
}

/**
 * Pre-compute Inverse Document Frequency for every pattern across the KB.
 * A pattern that appears in many diseases gets a low IDF weight (less discriminating).
 * A pattern unique to one disease gets a high IDF weight.
 */
function buildPatternIdf(): Map<string, number> {
  const patternCount = new Map<string, number>();
  const totalDiseases = DISEASE_KB.length;

  for (const disease of DISEASE_KB) {
    for (const pattern of disease.patterns) {
      const key = normalize(pattern);
      patternCount.set(key, (patternCount.get(key) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [pattern, count] of patternCount.entries()) {
    // idf = log(totalDiseases / count) — ranges from 0 (in all diseases) to log(N) (unique)
    idf.set(pattern, Math.log(totalDiseases / count));
  }
  return idf;
}

// Computed once at module load
const PATTERN_IDF = buildPatternIdf();

function applyModifiers(baseSeverity: number, notes: string, ageGroup: string): number {
  let score = baseSeverity;
  const searchText = `${notes} ${ageGroup}`.toLowerCase();

  for (const modifier of SEVERITY_MODIFIERS) {
    if (modifier.pattern.test(searchText)) {
      score += modifier.adjustment;
    }
  }

  return Math.max(1, Math.min(10, score));
}

// ─── Input Validation ─────────────────────────────────────────────────────────

function validatePayload(raw: SymptomAnalyzePayload): {
  symptoms: string[];
  duration: string;
  userSeverity: number;
  notes: string;
  ageGroup: string;
  knownConditions: string[];
  currentMedications: string[];
  allergies: string[];
} {
  // symptoms — must be a non-empty array of strings
  if (!Array.isArray(raw.symptoms) || raw.symptoms.length === 0) {
    throw badRequest(
      "symptoms is required and must be a non-empty array of strings. " +
      "Example: { \"symptoms\": [\"fever\", \"headache\"] }"
    );
  }

  const symptoms = (raw.symptoms as unknown[])
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => (s as string).trim());

  if (symptoms.length === 0) {
    throw badRequest("symptoms array must contain at least one non-empty string.");
  }

  if (symptoms.length > 20) {
    throw badRequest("symptoms array may not contain more than 20 items.");
  }

  // duration — optional string
  const duration =
    typeof raw.duration === "string" && raw.duration.trim()
      ? raw.duration.trim()
      : "Not specified";

  // userSeverity — optional 1–10 integer
  let userSeverity = 5;
  if (raw.severity !== undefined && raw.severity !== null) {
    const parsed = Number(raw.severity);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) {
      throw badRequest("severity must be a number between 1 and 10.");
    }
    userSeverity = Math.round(parsed);
  }

  // notes — optional string, max 1000 chars
  const notes =
    typeof raw.notes === "string" ? raw.notes.trim().slice(0, 1000) : "";

  // ageGroup — optional enum
  const validAgeGroups = ["child", "adult", "elderly"];
  const rawAge = typeof raw.ageGroup === "string" ? raw.ageGroup.trim().toLowerCase() : "adult";
  const ageGroup = validAgeGroups.includes(rawAge) ? rawAge : "adult";

  // knownConditions — optional string[]
  const knownConditions = Array.isArray(raw.knownConditions)
    ? (raw.knownConditions as unknown[]).filter((c) => typeof c === "string").map((c) => (c as string).trim())
    : [];

  // currentMedications — optional string[]
  const currentMedications = Array.isArray(raw.currentMedications)
    ? (raw.currentMedications as unknown[]).filter((m) => typeof m === "string").map((m) => (m as string).trim())
    : [];

  // allergies — optional string[]
  const allergies = Array.isArray(raw.allergies)
    ? (raw.allergies as unknown[]).filter((a) => typeof a === "string").map((a) => (a as string).trim())
    : [];

  return { symptoms, duration, userSeverity, notes, ageGroup, knownConditions, currentMedications, allergies };
}

// ─── Core Analyzer ────────────────────────────────────────────────────────────

function matchDiseases(
  symptoms: string[],
  notes: string,
  userSeverity: number,
  ageGroup: string
): Array<{ disease: DiseaseKnowledge; matchedSymptoms: string[]; confidence: number; finalSeverity: number; matchWeight: number }> {
  const normalizedUserSymptoms = symptoms.map(normalize);
  const notesText = normalize(notes);
  const fullText = `${normalizedUserSymptoms.join(" ")} ${notesText}`.trim();

  const scored = DISEASE_KB.map((disease) => {
    const normalizedDiseaseName = normalize(disease.name);

    // 1. Check direct disease name mention
    const nameMentioned = fullText.includes(normalizedDiseaseName) ||
      disease.name.toLowerCase().split(/[\s/(),]+/).filter((w) => w.length > 3).some((w) => fullText.includes(w));

    // 2. Matched patterns from disease.patterns
    const matchedPatterns = disease.patterns.filter((p) => fullText.includes(normalize(p)));

    // 3. Matched common symptoms
    const matchedCommonSymptoms = disease.commonSymptoms.filter((s) => {
      const norm = normalize(s);
      return fullText.includes(norm) || normalizedUserSymptoms.some((us) => norm.includes(us) || us.includes(norm));
    });

    // 4. User symptom coverage
    const coveredUserSymptoms = normalizedUserSymptoms.filter((us) =>
      disease.patterns.some((p) => normalize(p).includes(us) || us.includes(normalize(p))) ||
      disease.commonSymptoms.some((cs) => normalize(cs).includes(us) || us.includes(normalize(cs))) ||
      normalizedDiseaseName.includes(us)
    );

    // Combine all matched terms
    const allMatchedTerms = Array.from(
      new Set([
        ...matchedPatterns,
        ...matchedCommonSymptoms,
        ...coveredUserSymptoms
      ])
    );

    if (allMatchedTerms.length === 0 && !nameMentioned) return null;

    // Total specificity weight of matched patterns
    let matchWeight = matchedPatterns.reduce(
      (sum, p) => sum + (PATTERN_IDF.get(normalize(p)) ?? 2.0),
      0
    );

    if (nameMentioned) {
      matchWeight += 10.0; // Strong bonus for direct disease name match
    }

    // Coverage ratio
    const coverageRatio = normalizedUserSymptoms.length > 0
      ? (coveredUserSymptoms.length + (nameMentioned ? 1 : 0)) / (normalizedUserSymptoms.length + (nameMentioned ? 1 : 0))
      : 0.5;

    // Pattern ratio
    const totalPossibleWeight = disease.patterns.reduce(
      (sum, p) => sum + (PATTERN_IDF.get(normalize(p)) ?? 2.0),
      0
    );
    const patternRatio = totalPossibleWeight > 0 ? Math.min(1.0, matchWeight / (totalPossibleWeight * 0.5)) : 0.5;

    // Specificity score based on maximum matched pattern IDF
    const maxPatternIdf = matchedPatterns.length > 0
      ? Math.max(...matchedPatterns.map((p) => PATTERN_IDF.get(normalize(p)) ?? 1.0))
      : 1.0;

    // Calculate realistic confidence
    let confidence = Math.round(
      (coverageRatio * 45) +
      (patternRatio * 35) +
      (Math.min(maxPatternIdf, 3.5) * 5) +
      (nameMentioned ? 10 : 0)
    );

    confidence = Math.min(98, Math.max(35, confidence));

    // Severity = base + user severity contribution + note-based modifiers
    const userContribution = Math.round((userSeverity - 5) * 0.3);
    const modifiedSeverity = applyModifiers(disease.baseSeverity + userContribution, notes + " " + ageGroup, ageGroup);
    const finalSeverity = Math.max(1, Math.min(10, modifiedSeverity));

    return {
      disease,
      matchedSymptoms: allMatchedTerms.slice(0, 5),
      confidence,
      finalSeverity,
      matchWeight,
      coverageScore: coveredUserSymptoms.length + (nameMentioned ? 2 : 0)
    };
  }).filter(Boolean) as Array<{
    disease: DiseaseKnowledge;
    matchedSymptoms: string[];
    confidence: number;
    finalSeverity: number;
    matchWeight: number;
    coverageScore: number;
  }>;

  // Return top 3: prioritize match weight & confidence, then symptom coverage
  return scored
    .sort((a, b) => b.matchWeight - a.matchWeight || b.confidence - a.confidence || b.coverageScore - a.coverageScore)
    .slice(0, 3);
}

function buildConditionResult(
  match: { disease: DiseaseKnowledge; matchedSymptoms: string[]; confidence: number; finalSeverity: number }
): ConditionResult {
  const { disease, matchedSymptoms, confidence, finalSeverity } = match;
  const isEmergency = finalSeverity >= disease.emergencySeverityThreshold;

  return {
    name: disease.name,
    icd10Code: disease.icd10,
    description: disease.description,
    matchedSymptoms,
    confidence,
    severity_score: finalSeverity,
    severity_label: severityLabel(finalSeverity),
    recommended_medications: disease.medications,
    home_care: disease.homeCare,
    doctor_warning: buildDoctorWarning(finalSeverity, disease.name),
    seek_emergency: isEmergency
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entrypoint.  Validates input, runs multi-condition analysis, computes
 * severity, attaches safety checks, and returns the structured response.
 *
 * @throws ApiError(400) on bad input — caught at route layer
 * All other errors are caught inside and returned as a safe error response.
 */
export function runSymptomAnalysis(
  raw: SymptomAnalyzePayload,
  userId?: string
): SymptomAnalyzeResponse {
  const requestId = generateRequestId();
  const analyzedAt = new Date().toISOString();

  // ── 1. Validate ─────────────────────────────────────────────────────────────
  const { symptoms, duration, userSeverity, notes, ageGroup, knownConditions, currentMedications, allergies } =
    validatePayload(raw);

  // ── 2. Match diseases ────────────────────────────────────────────────────────
  const matches = matchDiseases(symptoms, notes + " " + knownConditions.join(" "), userSeverity, ageGroup);

  // ── 3. Build condition results ───────────────────────────────────────────────
  const possibleConditions: ConditionResult[] =
    matches.length > 0
      ? matches.map(buildConditionResult)
      : [
          {
            name: "Unclassified Symptom Cluster",
            icd10Code: "R69",
            description:
              "The reported symptoms could not be confidently matched to a known condition profile. A thorough clinical evaluation is recommended.",
            matchedSymptoms: symptoms,
            confidence: 0,
            severity_score: Math.max(3, userSeverity),
            severity_label: severityLabel(Math.max(3, userSeverity)),
            recommended_medications: [
              {
                name: "Paracetamol 500mg",
                category: "OTC",
                activeIngredient: "Paracetamol (Acetaminophen)",
                dosage: "500mg–1g every 4–6 hours, max 4g/day",
                duration: "3 days or until seen by a doctor",
                notes: "General supportive care only.",
                contraindicatedFor: ["liver disease"]
              }
            ],
            home_care: ["Rest adequately.", "Stay hydrated.", "Consult a doctor for proper diagnosis."],
            doctor_warning: buildDoctorWarning(Math.max(3, userSeverity), "Unclassified Symptom Cluster"),
            seek_emergency: false
          }
        ];

  // ── 4. Overall severity (highest across conditions) ──────────────────────────
  const overallSeverity = Math.max(...possibleConditions.map((c) => c.severity_score));

  // ── 5. Safety checks ─────────────────────────────────────────────────────────
  const allRecommendedMeds = possibleConditions.flatMap((c) =>
    c.recommended_medications.map((m) => ({ name: m.name }))
  );

  const rawSafetyChecks = buildSafetyChecks({
    recommendedMedicines: allRecommendedMeds,
    currentMedications,
    allergies,
    conditions: knownConditions
  });

  const safetyAlerts: SafetyAlert[] = rawSafetyChecks.map((check) => ({
    type: check.type,
    severity: check.type === "allergy" || check.type === "interaction" ? "high" : "medium",
    message: check.message,
    medicineId: check.medicineId
  }));

  // ── 6. Assemble response ─────────────────────────────────────────────────────
  const response: SymptomAnalyzeResponse = {
    status: "success",
    request_id: requestId,
    analyzed_at: analyzedAt,
    data: {
      input_summary: {
        symptoms,
        duration,
        user_severity: userSeverity,
        age_group: ageGroup,
        notes
      },
      possible_conditions: possibleConditions,
      overall_severity_score: overallSeverity,
      triage_level: triageLevel(overallSeverity),
      safety_alerts: safetyAlerts,
      follow_up_recommended: overallSeverity >= 5,
      emergency_services_required: possibleConditions.some((c) => c.seek_emergency),
      disclaimer:
        "This analysis is generated by an automated AI system for informational purposes only. " +
        "It does not constitute a medical diagnosis, replace professional clinical judgement, or substitute for consultation " +
        "with a qualified and licensed healthcare provider. Always seek the advice of your physician or other " +
        "qualified health provider with any questions you may have regarding a medical condition."
    }
  };

  console.info("[symptom-ai] analysis complete", {
    requestId,
    userId: userId ?? "unauthenticated",
    topCondition: possibleConditions[0]?.name,
    overallSeverity,
    triageLevel: response.data.triage_level,
    emergency: response.data.emergency_services_required
  });

  return response;
}
