export const featureModules = [
    {
        id: "symptom-engine",
        name: "AI Symptom Engine",
        summary: "Accepts text or voice symptoms and returns likely conditions with medicine guidance.",
        icon: "🤖"
    },
    {
        id: "ocr-verification",
        name: "Prescription OCR",
        summary: "Extracts medicine names, dosages, and doctor details from printed or handwritten prescriptions.",
        icon: "📋"
    },
    {
        id: "drug-safety",
        name: "Drug Interaction Detector",
        summary: "Checks new medicines against history, allergies, and known interaction datasets.",
        icon: "💊"
    },
    {
        id: "pharmacy-selector",
        name: "Smart Pharmacy Selector",
        summary: "Ranks pharmacies by stock, distance, load, and rating before confirmation.",
        icon: "🏪"
    },
    {
        id: "delivery",
        name: "Delivery Tracking",
        summary: "Provides live tracking, ETA updates, OTP confirmation, and proof of delivery.",
        icon: "🚚"
    },
    {
        id: "health-profile",
        name: "Patient Health Profile",
        summary: "Stores conditions, refill history, allergies, and a lifetime prescription vault.",
        icon: "👤"
    }
];
export const primaryRoutes = [
    { path: "/", label: "Home", icon: "⌂" },
    { path: "/login", label: "Login", icon: "🔐" },
    { path: "/symptoms", label: "AI Doctor", icon: "⚕" },
    { path: "/catalog", label: "Medicines", icon: "💊" },
    { path: "/cart", label: "Cart", icon: "🛒" },
    { path: "/orders", label: "Orders", icon: "📦" },
    { path: "/prescriptions/upload", label: "Prescription", icon: "📋" },
    { path: "/profile", label: "Profile", icon: "👤" }
];
export const bottomNavRoutes = [
    { path: "/", label: "Home", icon: "⌂" },
    { path: "/symptoms", label: "AI Doctor", icon: "⚕" },
    { path: "/catalog", label: "Medicines", icon: "💊" },
    { path: "/orders", label: "Orders", icon: "📦" },
    { path: "/profile", label: "Profile", icon: "👤" }
];
export const dashboardHighlights = [
    { label: "Medicines catalogued", value: "10,000+" },
    { label: "Target delivery time", value: "2-4 hrs" },
    { label: "AI diagnostic accuracy", value: "94%+" },
    { label: "Initial launch markets", value: "3 cities" }
];
export const categories = [
    { id: "tablets", name: "Tablets", icon: "💊", count: "" },
    { id: "injections", name: "Injections", icon: "💉", count: "" },
    { id: "devices", name: "Devices", icon: "🩺", count: "" },
    { id: "ayurveda", name: "Ayurveda", icon: "🌿", count: "" },
    { id: "baby", name: "Baby Care", icon: "🍼", count: "" },
    { id: "first-aid", name: "First Aid", icon: "🩹", count: "" }
];
export const medicines = [
    // ── Tablets ────────────────────────────────────────────────────────────────
    {
        id: "paracetamol-650",
        name: "Paracetamol 650mg",
        brand: "GSK Pharma",
        price: "₹28",
        tag: "AI Pick",
        category: "tablets",
        description: "First-line antipyretic for fever, headache, and body aches."
    },
    {
        id: "ibuprofen-400",
        name: "Ibuprofen 400mg",
        brand: "Combiflam",
        price: "₹48",
        tag: "Anti-inflammatory",
        category: "tablets",
        description: "NSAID for acute body pain, dental pain, and inflammation."
    },
    {
        id: "cetirizine-10",
        name: "Cetirizine 10mg",
        brand: "Cipla",
        price: "₹22",
        tag: "Anti-allergy",
        category: "tablets",
        description: "Antihistamine for runny nose, sneezing, cold, and skin allergies."
    },
    {
        id: "amoxicillin-500",
        name: "Amoxicillin 500mg",
        brand: "Sun Pharma",
        price: "₹85",
        tag: "Rx",
        category: "tablets",
        description: "Prescription broad-spectrum antibiotic for bacterial infections."
    },
    {
        id: "metformin-500",
        name: "Metformin 500mg",
        brand: "USV Pharma",
        price: "₹42",
        tag: "Diabetes",
        category: "tablets",
        description: "Oral anti-diabetic medication for managing blood glucose levels."
    },
    {
        id: "pantoprazole-40",
        name: "Pantoprazole 40mg",
        brand: "Alkem Labs",
        price: "₹68",
        tag: "Acidity",
        category: "tablets",
        description: "Proton pump inhibitor for severe acidity, GERD, and heartburn."
    },
    {
        id: "azithromycin-500",
        name: "Azithromycin 500mg",
        brand: "Zithromax",
        price: "₹95",
        tag: "Rx",
        category: "tablets",
        description: "Macrolide antibiotic for throat, chest, and sinus bacterial infections."
    },
    {
        id: "atorvastatin-10",
        name: "Atorvastatin 10mg",
        brand: "Zydus Healthcare",
        price: "₹75",
        tag: "Cholesterol",
        category: "tablets",
        description: "Statin medication to lower LDL cholesterol and protect heart health."
    },
    {
        id: "dolo-650",
        name: "Dolo 650mg",
        brand: "Micro Labs",
        price: "₹32",
        tag: "Popular",
        category: "tablets",
        description: "Fast-acting paracetamol formulation for high fever and body pain."
    },
    {
        id: "vitamin-c-1000",
        name: "Vitamin C 1000mg",
        brand: "HealthVit",
        price: "₹120",
        tag: "Immunity",
        category: "tablets",
        description: "Effervescent Vitamin C + Zinc for active immune defence."
    },
    {
        id: "aspirin-500",
        name: "Aspirin 500mg",
        brand: "Bayer",
        price: "₹45",
        tag: "Pain Relief",
        category: "tablets",
        description: "Analgesic and antiplatelet for headaches and cardiovascular support."
    },
    {
        id: "omeprazole-20",
        name: "Omeprazole 20mg",
        brand: "Cipla",
        price: "₹72",
        tag: "Acid Reflux",
        category: "tablets",
        description: "Reduces stomach acid secretion for heartburn and gastric ulcers."
    },
    {
        id: "levocetirizine-5",
        name: "Levocetirizine 5mg",
        brand: "Cipla",
        price: "₹35",
        tag: "Allergy",
        category: "tablets",
        description: "Non-drowsy 2nd-gen antihistamine for allergic rhinitis."
    },
    // ── Injections ─────────────────────────────────────────────────────────────
    {
        id: "insulin-glargine",
        name: "Insulin Glargine 100IU/ml",
        brand: "Lantus (Sanofi)",
        price: "₹850",
        tag: "Rx",
        category: "injections",
        description: "Long-acting basal insulin cartridge for 24-hour glycemic control."
    },
    {
        id: "tt-injection",
        name: "TT Injection (Tetanus Toxoid)",
        brand: "Serum Institute",
        price: "₹45",
        tag: "Vaccine",
        category: "injections",
        description: "Active immunisation against tetanus for wounds, cuts, and injury prevention."
    },
    {
        id: "vitamin-b12-inj",
        name: "Vitamin B12 Injection (Methylcobalamin)",
        brand: "Optineuron / Neurobion",
        price: "₹65",
        tag: "Supplement",
        category: "injections",
        description: "Injectable Vitamin B12 complex for neuropathy, fatigue, and deficiency."
    },
    {
        id: "ceftriaxone-1g",
        name: "Ceftriaxone 1g Injection",
        brand: "Monocef (Aristo)",
        price: "₹120",
        tag: "Rx",
        category: "injections",
        description: "Hospital-grade IV/IM cephalosporin antibiotic for severe infections."
    },
    {
        id: "diclofenac-sodium-inj",
        name: "Diclofenac Sodium Injection 75mg",
        brand: "Dynapar AQ",
        price: "₹52",
        tag: "Pain Relief",
        category: "injections",
        description: "Fast-acting analgesic injection for acute post-op, renal colic, or trauma pain."
    },
    {
        id: "dexamethasone-inj",
        name: "Dexamethasone 4mg Injection",
        brand: "Samarth Pharma",
        price: "₹38",
        tag: "Anti-inflammatory",
        category: "injections",
        description: "Emergency corticosteroid injection for severe inflammation and allergic shock."
    },
    {
        id: "ondansetron-inj",
        name: "Ondansetron 4mg Injection",
        brand: "Emeset (Cipla)",
        price: "₹55",
        tag: "Anti-emetic",
        category: "injections",
        description: "Injectable 5-HT3 blocker to stop acute vomiting and nausea."
    },
    {
        id: "rabies-vaccine",
        name: "Rabies Vaccine (HDCV)",
        brand: "Rabipur (Bharat Biotech)",
        price: "₹650",
        tag: "Vaccine",
        category: "injections",
        description: "Purified chick embryo cell vaccine for animal bite rabies prophylaxis."
    },
    // ── Devices ────────────────────────────────────────────────────────────────
    {
        id: "digital-thermometer",
        name: "Digital Thermometer",
        brand: "Dr. Morepen",
        price: "₹299",
        tag: "Essential",
        category: "devices",
        description: "High-precision 10-second beep alert oral and underarm fever thermometer."
    },
    {
        id: "bp-monitor-digital",
        name: "BP Monitor (Digital Upper Arm)",
        brand: "Omron Healthcare",
        price: "₹1,499",
        tag: "Popular",
        category: "devices",
        description: "Automatic Intellisense blood pressure monitor with hypertension indicator."
    },
    {
        id: "pulse-oximeter",
        name: "Pulse Oximeter (Fingertip)",
        brand: "Choicemmed",
        price: "₹899",
        tag: "Popular",
        category: "devices",
        description: "Dual-color OLED fingertip SpO2 oxygen saturation and pulse rate monitor."
    },
    {
        id: "glucometer-kit",
        name: "Glucometer Kit (Accu-Chek Instant)",
        brand: "Accu-Chek (Roche)",
        price: "₹1,200",
        tag: "AI Pick",
        category: "devices",
        description: "Blood glucose monitoring meter kit with 10 test strips, lancing device, and lancets."
    },
    {
        id: "nebulizer-kit",
        name: "Nebulizer Machine",
        brand: "Philips Respironics / Omron",
        price: "₹2,499",
        tag: "Respiratory",
        category: "devices",
        description: "Heavy-duty compressor nebulizer for asthma inhalant medication mist delivery."
    },
    {
        id: "weighing-scale",
        name: "Digital Weighing Scale",
        brand: "Seca Healthcare",
        price: "₹699",
        tag: "Fitness",
        category: "devices",
        description: "Precision tempered glass electronic body weight scale with step-on technology."
    },
    // ── Ayurveda ───────────────────────────────────────────────────────────────
    {
        id: "ashwagandha-churna",
        name: "Ashwagandha Churna (Powder)",
        brand: "Himalaya Wellness",
        price: "₹180",
        tag: "Adaptogen",
        category: "ayurveda",
        description: "Pure organic Ashwagandha root powder to reduce cortisol, stress, and anxiety."
    },
    {
        id: "triphala-tablets",
        name: "Triphala Tablets",
        brand: "Dabur",
        price: "₹95",
        tag: "Digestive",
        category: "ayurveda",
        description: "Classic Ayurvedic Haritaki, Bibhitaki, and Amalaki tri-herb digestive cleanser."
    },
    {
        id: "chyawanprash-500g",
        name: "Chyawanprash 500g",
        brand: "Dabur",
        price: "₹220",
        tag: "Immunity",
        category: "ayurveda",
        description: "Traditional rasayana with 40+ rejuvenating herbs and rich amla Vitamin C."
    },
    {
        id: "giloy-ghanvati",
        name: "Giloy Ghanvati",
        brand: "Patanjali / Baidyanath",
        price: "₹110",
        tag: "Immunity",
        category: "ayurveda",
        description: "Concentrated Tinospora cordifolia extract for platelet health and fever defence."
    },
    {
        id: "tulsi-drops",
        name: "Tulsi Drops (Panch Tulsi)",
        brand: "Dabur",
        price: "₹140",
        tag: "Wellness",
        category: "ayurveda",
        description: "Extract of 5 rare holy basil varieties for throat relief and respiratory immunity."
    },
    {
        id: "brahmi-capsule",
        name: "Brahmi Memory Capsule",
        brand: "Patanjali",
        price: "₹145",
        tag: "Brain Health",
        category: "ayurveda",
        description: "Bacopa monnieri herb capsule for memory clarity, focus, and restful sleep."
    },
    {
        id: "neem-karela-juice",
        name: "Neem Karela Juice 500ml",
        brand: "Baidyanath",
        price: "₹160",
        tag: "Sugar Control",
        category: "ayurveda",
        description: "Cold-pressed pure bitter gourd and neem juice for blood purification."
    },
    // ── Baby Care ──────────────────────────────────────────────────────────────
    {
        id: "baby-diaper-rash-cream",
        name: "Diaper Rash Cream 50g",
        brand: "Sudocrem / Sebamed",
        price: "₹230",
        tag: "Skin Care",
        category: "baby",
        description: "Zinc oxide barrier cream to soothe, heal, and prevent infant diaper redness."
    },
    {
        id: "baby-gripe-water",
        name: "Gripe Water 120ml",
        brand: "Woodward's",
        price: "₹85",
        tag: "Colic Relief",
        category: "baby",
        description: "Alcohol-free dill oil and sodium bicarbonate for baby colic, gas, and teething."
    },
    {
        id: "baby-nasal-drops",
        name: "Baby Nasal Drops (Saline)",
        brand: "Nasoclear (FDC)",
        price: "₹75",
        tag: "Congestion",
        category: "baby",
        description: "Isotonic gentle purified saline drops to safely clear infant blocked noses."
    },
    {
        id: "baby-moisturizing-lotion",
        name: "Baby Moisturizing Lotion 200ml",
        brand: "Aveeno Baby",
        price: "₹290",
        tag: "Gentle Care",
        category: "baby",
        description: "Natural colloidal oatmeal lotion providing 24-hour nourishment for sensitive skin."
    },
    {
        id: "gentle-baby-wipes",
        name: "Gentle Baby Wipes (Pack of 72)",
        brand: "Huggies / Pampers",
        price: "₹150",
        tag: "Hygiene",
        category: "baby",
        description: "99% pure water wipes with organic aloe, paraben-free and dermatologist tested."
    },
    {
        id: "baby-vitamin-d3",
        name: "Baby Vitamin D3 Drops 15ml",
        brand: "D-Drops (400 IU)",
        price: "₹350",
        tag: "Supplement",
        category: "baby",
        description: "Pediatrician-recommended daily Vitamin D3 for infant bone and teeth growth."
    },
    {
        id: "baby-paracetamol-syrup",
        name: "Baby Paracetamol Syrup 60ml",
        brand: "Calpol 120 (GSK)",
        price: "₹65",
        tag: "Fever Relief",
        category: "baby",
        description: "Strawberry-flavoured pediatric paracetamol suspension for pain and fever."
    },
    // ── First Aid ──────────────────────────────────────────────────────────────
    {
        id: "dettol-antiseptic-liquid",
        name: "Antiseptic Liquid (Dettol 250ml)",
        brand: "Reckitt Benckiser",
        price: "₹98",
        tag: "Disinfectant",
        category: "first-aid",
        description: "Hospital-trusted chloroxylenol liquid for wound disinfection and antiseptic cleaning."
    },
    {
        id: "savlon-antiseptic",
        name: "Savlon Antiseptic Liquid 100ml",
        brand: "ITC Healthcare",
        price: "₹50",
        tag: "Disinfectant",
        category: "first-aid",
        description: "Non-stinging cetrimide + chlorhexidine antiseptic solution for cuts and burns."
    },
    {
        id: "adhesive-bandages",
        name: "Adhesive Bandages (Pack of 20)",
        brand: "Band-Aid (Johnson & Johnson)",
        price: "₹45",
        tag: "Wound Care",
        category: "first-aid",
        description: "Water-resistant sterile adhesive strips with Quiltvent pad for fast healing."
    },
    {
        id: "gauze-swabs",
        name: "Sterile Gauze Swabs (Pack of 10)",
        brand: "Datt Mediproducts",
        price: "₹60",
        tag: "Wound Care",
        category: "first-aid",
        description: "100% cotton sterile absorbent surgical gauze sponges (7.5cm x 7.5cm)."
    },
    {
        id: "burn-ointment",
        name: "Burn Ointment (Burnol 30g)",
        brand: "Dr. Morepen",
        price: "₹85",
        tag: "Burns",
        category: "first-aid",
        description: "Aminacrine and cetrimide germicidal cream for immediate minor burn and scald relief."
    },
    {
        id: "micropore-tape",
        name: "Micropore Surgical Tape (1 inch x 9.1m)",
        brand: "3M Healthcare",
        price: "₹55",
        tag: "First Aid",
        category: "first-aid",
        description: "Hypoallergenic breathable medical paper tape that adheres gently to skin."
    },
    {
        id: "betadine-antiseptic",
        name: "Betadine Antiseptic Solution 100ml",
        brand: "Win-Medicare",
        price: "₹75",
        tag: "Wound Care",
        category: "first-aid",
        description: "Povidone-iodine 5% microbicidal solution for topical disinfection."
    },
    {
        id: "bandage-roll",
        name: "Crepe Bandage Roll 10cm",
        brand: "3M Healthcare",
        price: "₹55",
        tag: "Support",
        category: "first-aid",
        description: "High-stretch elastic compression bandage for sprains, muscle pulls, and joints."
    },
    {
        id: "ors-sachets",
        name: "ORS Sachets (Electral 21.8g)",
        brand: "FDC / Electral",
        price: "₹38",
        tag: "Hydration",
        category: "first-aid",
        description: "WHO-recommended oral rehydration formulation for rapid electrolyte recovery."
    }
];
export const notifications = [
    {
        id: "n1",
        icon: "📦",
        title: "Order shipped",
        message: "Your Paracetamol order is on the way from GreenLife Pharmacy.",
        time: "2 min ago"
    },
    {
        id: "n2",
        icon: "🤖",
        title: "AI tip",
        message: "Remember your evening dose of Metformin after dinner.",
        time: "1 hr ago"
    },
    {
        id: "n3",
        icon: "⚠️",
        title: "Drug interaction alert",
        message: "A new antibiotic may conflict with your current allergy medication.",
        time: "Today"
    }
];
export const orders = [
    {
        id: "MC-004521",
        status: "Out for delivery",
        eta: "ETA 18 mins",
        items: ["Paracetamol 650mg", "ORS Sachets"],
        pharmacy: "CarePlus Pharmacy"
    },
    {
        id: "MC-004487",
        status: "Delivered",
        eta: "Delivered yesterday",
        items: ["Metformin 500mg", "Atorvastatin 10mg"],
        pharmacy: "Metro Meds"
    }
];
export const symptomChips = [
    { label: "Fever" },
    { label: "Headache" },
    { label: "Cold" },
    { label: "Cough" },
    { label: "Body Pain" },
    { label: "Fatigue" },
    { label: "Nausea" },
    { label: "Dizziness" },
    { label: "Sore Throat" },
    { label: "Runny Nose" },
    { label: "Sneezing" },
    { label: "Chest Pain" },
    { label: "Shortness of Breath" },
    { label: "Vomiting" },
    { label: "Diarrhea" },
    { label: "Abdominal Pain" },
    { label: "Indigestion" },
    { label: "Skin Rash" },
    { label: "Joint Pain" }
];
export const symptomDurations = ["1 day", "2-3 days", "1 week", "2+ weeks"];
export const aiResult = {
    condition: "Viral Fever",
    confidence: "94%",
    matchedSymptoms: ["Fever", "Headache", "Body pain", "Fatigue"],
    warning: "Consult a doctor if fever exceeds 103°F or lasts more than 3 days.",
    dosage: [
        { label: "Dosage", value: "1-2 tablets every 6-8 hours" },
        { label: "Duration", value: "Use for 3-5 days unless your doctor advises otherwise" },
        { label: "Avoid", value: "Alcohol and duplicate paracetamol products" }
    ]
};
export const userProfile = {
    name: "Ravi Kumar",
    email: "ravi@email.com",
    chronicConditions: ["Diabetes Type 2", "Hypertension"],
    currentMedications: ["Metformin 500mg", "Amlodipine 5mg"],
    allergies: ["Penicillin", "Dust"],
    facts: [
        { label: "Age", value: "34" },
        { label: "Weight", value: "72 kg" },
        { label: "Blood", value: "B+" }
    ]
};
export const onboardingSlides = [
    {
        title: "AI-powered medicine access",
        summary: "Search medicines, upload prescriptions, and get safe recommendations in one place."
    },
    {
        title: "Prescription OCR and verification",
        summary: "Supports printed and handwritten prescriptions with fast pharmacist escalation."
    },
    {
        title: "Smart delivery and refill care",
        summary: "Track orders live, manage chronic medications, and receive refill reminders."
    }
];
export const apiModules = [
    "auth",
    "users",
    "health-profile",
    "catalog",
    "prescriptions",
    "drug-safety",
    "cart",
    "orders",
    "pharmacy-network",
    "delivery",
    "payments"
];
export const screenInventory = [
    { id: 1, slug: "splash", section: "Onboarding", title: "Splash", summary: "Brand-first entry screen with MediCare AI identity and green hero treatment.", cta: "Open app" },
    { id: 2, slug: "onboarding-1", section: "Onboarding", title: "Onboarding 1", summary: "Introduces AI-powered medicine access and safer ordering.", cta: "Continue" },
    { id: 3, slug: "onboarding-2", section: "Onboarding", title: "Onboarding 2", summary: "Highlights prescription OCR for handwritten and printed documents.", cta: "Continue" },
    { id: 4, slug: "onboarding-3", section: "Onboarding", title: "Onboarding 3", summary: "Explains fast delivery, refill reminders, and patient-first care.", cta: "Get started" },
    { id: 5, slug: "login", section: "Authentication", title: "Login", summary: "Email, password, Google sign-in, and secure access flow.", cta: "Sign in" },
    { id: 6, slug: "sign-up", section: "Authentication", title: "Sign Up", summary: "Create account with name, email, phone, and password.", cta: "Create account" },
    { id: 7, slug: "otp-verify", section: "Authentication", title: "OTP Verify", summary: "Verify mobile number with 6-digit OTP confirmation.", cta: "Verify OTP" },
    { id: 8, slug: "forgot-password", section: "Authentication", title: "Forgot Password", summary: "Reset password via registered email recovery flow.", cta: "Send reset link" },
    { id: 9, slug: "home-dashboard", section: "Home & Dashboard", title: "Home Dashboard", summary: "Hero banner, search, categories, recommendations, and active orders.", cta: "Explore" },
    { id: 10, slug: "notifications", section: "Home & Dashboard", title: "Notifications", summary: "Alerts for orders, AI safety signals, reminders, and offers.", cta: "Review alerts" },
    { id: 11, slug: "search-active", section: "Home & Dashboard", title: "Search Active", summary: "Recent searches, search suggestions, and medicine results.", cta: "Search medicines" },
    { id: 12, slug: "quick-reorder", section: "Home & Dashboard", title: "Quick Reorder", summary: "One-tap reorder flow for chronic medications and repeat purchases.", cta: "Reorder all" },
    { id: 13, slug: "health-profile", section: "Home & Dashboard", title: "Health Profile", summary: "Patient demographics, conditions, medications, and care context.", cta: "Edit profile" },
    { id: 14, slug: "symptom-input", section: "AI Symptom Flow", title: "Symptom Input", summary: "Symptom chips, free-text input, duration selection, and severity scale.", cta: "Analyse symptoms" },
    { id: 15, slug: "ai-analysing", section: "AI Symptom Flow", title: "AI Analysing", summary: "Processing screen showing step-by-step AI analysis progress.", cta: "Analysing..." },
    { id: 16, slug: "ai-results", section: "AI Symptom Flow", title: "AI Results", summary: "Detected condition, confidence, symptoms matched, and warnings.", cta: "View medicines" },
    { id: 17, slug: "ai-recommendations", section: "AI Symptom Flow", title: "AI Recommendations", summary: "AI-generated medicine list with tags and guidance context.", cta: "Add recommended" },
    { id: 18, slug: "dosage-detail", section: "AI Symptom Flow", title: "Dosage Detail", summary: "Dosage rules, duration, food guidance, and side effect notes.", cta: "Add to cart" },
    { id: 19, slug: "browse-medicines", section: "Medicine Catalog", title: "Browse Medicines", summary: "Search-driven catalog home with categories and featured products.", cta: "Browse catalog" },
    { id: 20, slug: "category-view", section: "Medicine Catalog", title: "Category View", summary: "Filtered listing within a medicine category such as antibiotics.", cta: "Filter items" },
    { id: 21, slug: "medicine-detail", section: "Medicine Catalog", title: "Medicine Detail", summary: "Product hero, key facts, reviews, pricing, and quantity control.", cta: "Add to cart" },
    { id: 22, slug: "reviews", section: "Medicine Catalog", title: "Reviews", summary: "Ratings summary and customer review feed for a medicine.", cta: "Read reviews" },
    { id: 23, slug: "compare", section: "Medicine Catalog", title: "Compare", summary: "Side-by-side medicine comparison for brand, form, and price.", cta: "Compare options" },
    { id: 24, slug: "cart", section: "Cart & Checkout", title: "Cart", summary: "Cart review with quantities, subtotals, and checkout trigger.", cta: "Proceed to checkout" },
    { id: 25, slug: "delivery-address", section: "Cart & Checkout", title: "Delivery Address", summary: "Address selection with saved locations and delivery preferences.", cta: "Use address" },
    { id: 26, slug: "add-address", section: "Cart & Checkout", title: "Add Address", summary: "New address form with landmark, instructions, and labels.", cta: "Save address" },
    { id: 27, slug: "payment", section: "Cart & Checkout", title: "Payment", summary: "Razorpay, Stripe, and COD choices with confirmation summary.", cta: "Pay now" },
    { id: 28, slug: "order-confirm", section: "Cart & Checkout", title: "Order Confirm", summary: "Final order summary before successful placement.", cta: "Place order" },
    { id: 29, slug: "order-success", section: "Order Management", title: "Order Success", summary: "Post-purchase success state with receipt and next actions.", cta: "Track order" },
    { id: 30, slug: "live-tracking", section: "Order Management", title: "Live Tracking", summary: "GPS-style tracking, ETA, OTP confirmation, and rider status.", cta: "Track live" },
    { id: 31, slug: "order-history", section: "Order Management", title: "Order History", summary: "Historic list of delivered and active orders.", cta: "View orders" },
    { id: 32, slug: "order-detail", section: "Order Management", title: "Order Detail", summary: "Detailed order contents, pharmacy, payment, and delivery timeline.", cta: "See detail" },
    { id: 33, slug: "return-request", section: "Order Management", title: "Return Request", summary: "Submit damaged, wrong, or incomplete order return issues.", cta: "Request return" },
    { id: 34, slug: "upload-rx", section: "Prescription", title: "Upload Rx", summary: "Upload prescription image or PDF for OCR and pharmacist review.", cta: "Upload prescription" },
    { id: 35, slug: "rx-verified", section: "Prescription", title: "Rx Verified", summary: "Successful OCR verification state with extracted medicine list.", cta: "Continue to medicines" },
    { id: 36, slug: "rx-vault", section: "Prescription", title: "Rx Vault", summary: "Stored prescription archive with search and reuse options.", cta: "Open vault" },
    { id: 37, slug: "user-profile", section: "Settings & Profile", title: "User Profile", summary: "Account overview, health info, and saved settings.", cta: "Manage account" },
    { id: 38, slug: "edit-profile", section: "Settings & Profile", title: "Edit Profile", summary: "Editable personal details, age, address, and medical metadata.", cta: "Save changes" },
    { id: 39, slug: "app-settings", section: "Settings & Profile", title: "App Settings", summary: "Theme, language, notifications, biometrics, and preferences.", cta: "Update settings" },
    { id: 40, slug: "help-support", section: "Settings & Profile", title: "Help & Support", summary: "FAQ, support contact, and escalation options.", cta: "Get help" },
    { id: 41, slug: "about-terms", section: "Settings & Profile", title: "About / Terms", summary: "Company info, privacy, terms, and compliance references.", cta: "Read more" },
    { id: 42, slug: "rate-review", section: "Settings & Profile", title: "Rate & Review", summary: "Collect app feedback, star ratings, and product sentiment.", cta: "Submit review" }
];
export const screenSections = Array.from(new Set(screenInventory.map((screen) => screen.section)));
export function getScreenBySlug(slug) {
    return screenInventory.find((screen) => screen.slug === slug);
}
const symptomNormalization = [
    [/\b(high )?temperature\b/, "fever"],
    [/\b(pyrexia|feverish)\b/, "fever"],
    [/\b(body ache|body pain|muscle ache|muscle pain|aching)\b/, "body pain"],
    [/\b(headache|head pain|migraine)\b/, "headache"],
    [/\b(runny nose|nasal drip|post nasal|nasal congestion)\b/, "runny nose"],
    [/\b(sore throat|throat pain)\b/, "sore throat"],
    [/\b(cough|coughing)\b/, "cough"],
    [/\b(chills|cold sweat|shivering)\b/, "chills"],
    [/\b(fatigue|tired|exhausted|weakness)\b/, "fatigue"],
    [/\b(nausea|nauseous|queasy)\b/, "nausea"],
    [/\b(vomiting|throwing up)\b/, "vomiting"],
    [/\b(diarrhea|diarrhoea|loose motion|loose stools)\b/, "diarrhea"],
    [/\b(indigestion|acidity|heartburn|reflux)\b/, "indigestion"],
    [/\b(itching|itchy|rash|hives)\b/, "skin rash"],
    [/\b(joint pain|joint ache|arthritis|rheumatism)\b/, "joint pain"],
    [/\b(shortness of breath|breathless|difficulty breathing)\b/, "shortness of breath"],
    [/\b(chest pain|pressure in chest)\b/, "chest pain"],
    [/\b(sneezing|sneeze)\b/, "sneezing"],
    [/\b(cold|common cold|cold-like)\b/, "cold"],
    [/\b(allergy|allergic)\b/, "allergy"],
    [/\b(fever|temperature)\b/, "fever"]
];
const diseaseKnowledgeBase = [
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
const symptomProfiles = [
    {
        condition: "Viral Fever",
        patterns: ["fever", "headache", "body pain", "fatigue", "chills", "temperature"],
        confidence: "94%",
        warning: "Consult a doctor if fever exceeds 103°F, lasts more than 3 days, or if you feel severe weakness.",
        dosage: [
            { label: "Dosage", value: "1-2 tablets every 6-8 hours" },
            { label: "Duration", value: "Use for 3-5 days unless symptoms worsen" },
            { label: "Avoid", value: "Alcohol and duplicate paracetamol products" }
        ],
        recommendedMedicineIds: ["paracetamol-650", "vitamin-c-1000", "ors-sachets"],
        matchedSymptoms: ["Fever", "Headache", "Body pain", "Fatigue"]
    },
    {
        condition: "Common Cold & Cough",
        patterns: ["cold", "cough", "sneez", "runny nose", "nasal", "throat"],
        confidence: "87%",
        warning: "If cough persists for more than 2 weeks or you develop chest pain, consult a doctor.",
        dosage: [
            { label: "Dosage", value: "1-2 spoons of cough syrup three times daily" },
            { label: "Duration", value: "Use for 5-7 days" },
            { label: "Tips", value: "Stay hydrated, avoid dairy, and rest well" }
        ],
        recommendedMedicineIds: ["cough-syrup-100ml", "vitamin-c-1000", "cetirizine-10"],
        matchedSymptoms: ["Cough", "Cold", "Sore Throat"]
    },
    {
        condition: "Seasonal Allergy",
        patterns: ["allergy", "sneez", "itchy", "runny nose", "pollen", "nasal congestion"],
        confidence: "88%",
        warning: "Seasonal allergies are common. Seek a doctor if you develop wheezing, chest tightness, or severe swelling.",
        dosage: [
            { label: "Dosage", value: "1 tablet once daily in the morning" },
            { label: "Duration", value: "Continue for 5 days or until symptoms improve" },
            { label: "Avoid", value: "Allergens and other antihistamines without consulting your doctor" }
        ],
        recommendedMedicineIds: ["levocetirizine-5", "cetirizine-10", "vitamin-c-1000"],
        matchedSymptoms: ["Sneezing", "Runny nose", "Itchy eyes"]
    },
    {
        condition: "Acid Reflux & Indigestion",
        patterns: ["acid", "reflux", "indigestion", "heartburn", "gerd", "stomach"],
        confidence: "82%",
        warning: "If you experience chest pain, difficulty swallowing, or vomiting blood, seek immediate medical attention.",
        dosage: [
            { label: "Dosage", value: "1 tablet once daily before breakfast" },
            { label: "Duration", value: "Take for 7-14 days as needed" },
            { label: "Lifestyle", value: "Avoid spicy, fatty foods, caffeine, and eating late at night" }
        ],
        recommendedMedicineIds: ["omeprazole-20", "vitamin-c-1000"],
        matchedSymptoms: ["Indigestion", "Stomach pain", "Heartburn"]
    },
    {
        condition: "Dehydration Risk",
        patterns: ["dehyd", "vomit", "loose motion", "diarrhea", "nausea", "thirst"],
        confidence: "84%",
        warning: "Increase fluid intake and seek medical help if vomiting or diarrhea persists for more than 24 hours.",
        dosage: [
            { label: "Dosage", value: "Take 1 ORS sachet after each loose motion or vomiting episode" },
            { label: "Duration", value: "Use until hydration is restored, usually 1-2 days" },
            { label: "Avoid", value: "Sugary drinks, caffeine, and fatty foods until you recover" }
        ],
        recommendedMedicineIds: ["ors-sachets", "vitamin-c-1000"],
        matchedSymptoms: ["Vomiting", "Diarrhea", "Nausea"]
    },
    {
        condition: "Suspected Bacterial Infection",
        patterns: ["throat", "sore throat", "yellow phlegm", "swollen tonsils", "antibiotic", "feverish"],
        confidence: "79%",
        warning: "This may need prescription antibiotics. Review your allergies and current medication before starting treatment. Consult doctor urgently.",
        dosage: [
            { label: "Dosage", value: "1 tablet three times a day after food" },
            { label: "Duration", value: "Take for 7 days unless advised otherwise" },
            { label: "Avoid", value: "Skipping doses or stopping early may lead to resistance" }
        ],
        recommendedMedicineIds: ["azithromycin-500", "amoxicillin-500", "vitamin-c-1000"],
        matchedSymptoms: ["Sore throat", "Swollen glands", "Fever"]
    },
    {
        condition: "Flu-Like Illness",
        patterns: ["flu", "influenza", "body ache", "chills", "weakness", "muscle pain"],
        confidence: "85%",
        warning: "Flu can be serious. Monitor for difficulty breathing or chest pain. Seek doctor if symptoms worsen.",
        dosage: [
            { label: "Dosage", value: "1-2 tablets every 6-8 hours" },
            { label: "Duration", value: "Use for 5-7 days" },
            { label: "Rest", value: "Get adequate rest and stay hydrated" }
        ],
        recommendedMedicineIds: ["paracetamol-650", "dolo-650", "ginger-turmeric"],
        matchedSymptoms: ["Body Pain", "Fever", "Fatigue"]
    },
    {
        condition: "Migraine & Severe Headache",
        patterns: ["migraine", "severe headache", "throbbing", "one side", "light sensitive"],
        confidence: "80%",
        warning: "If accompanied by vision changes, weakness, or confusion, seek immediate medical help.",
        dosage: [
            { label: "Dosage", value: "1-2 tablets at first sign of migraine" },
            { label: "Duration", value: "Repeat every 4-6 hours if needed, max 3 times daily" },
            { label: "Prevention", value: "Keep a migraine diary and identify triggers" }
        ],
        recommendedMedicineIds: ["ibuprofen-400", "aspirin-500"],
        matchedSymptoms: ["Severe Headache", "Throbbing pain"]
    },
    {
        condition: "Joint & Muscle Pain",
        patterns: ["joint pain", "muscle pain", "arthritis", "rheumatism", "inflammation"],
        confidence: "78%",
        warning: "If pain is severe, accompanied by swelling, or doesn't improve in a week, consult a doctor.",
        dosage: [
            { label: "Dosage", value: "1 tablet three times daily with food" },
            { label: "Duration", value: "Use for 5-7 days" },
            { label: "Rest", value: "Apply ice for acute pain, heat for chronic stiffness" }
        ],
        recommendedMedicineIds: ["ibuprofen-400", "ginger-turmeric"],
        matchedSymptoms: ["Joint Pain", "Inflammation"]
    },
    {
        condition: "Skin Rash & Irritation",
        patterns: ["rash", "skin", "itching", "allergic", "hives", "eczema"],
        confidence: "76%",
        warning: "If rash spreads rapidly or you develop difficulty breathing, seek immediate medical attention.",
        dosage: [
            { label: "Dosage", value: "1 tablet once daily" },
            { label: "Duration", value: "Use for 5-7 days or until rash clears" },
            { label: "Care", value: "Keep the area clean and dry, avoid irritants" }
        ],
        recommendedMedicineIds: ["levocetirizine-5", "cetirizine-10"],
        matchedSymptoms: ["Skin Rash", "Itching"]
    },
    {
        condition: "Viral Fever",
        patterns: ["fever", "headache", "body pain", "fatigue", "chills", "temperature"],
        confidence: "94%",
        warning: "Consult a doctor if fever exceeds 103°F, lasts more than 3 days, or if you feel severe weakness.",
        dosage: [
            { label: "Dosage", value: "1-2 tablets every 6-8 hours" },
            { label: "Duration", value: "Use for 3-5 days unless symptoms worsen" },
            { label: "Avoid", value: "Alcohol and duplicate paracetamol products" }
        ],
        recommendedMedicineIds: ["paracetamol-650", "ors-sachets", "vitamin-c-1000"],
        matchedSymptoms: ["Fever", "Headache", "Body pain", "Fatigue"]
    }
];
function normalizeText(value) {
    return value?.trim().toLowerCase() ?? "";
}
function formatSymptomName(value) {
    const normalized = normalizeText(value);
    return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : "";
}
function getMedicinesByIds(ids) {
    return medicines.filter((item) => ids.includes(item.id));
}
function findSymptomProfile(text, symptoms) {
    const normalizedText = normalizeText(text);
    const normalizedSymptoms = symptoms.map(normalizeText);
    const scored = diseaseKnowledgeBase.map((item) => {
        const matchedPatterns = item.patterns.filter((pattern) => normalizedText.includes(pattern) || normalizedSymptoms.some((symptom) => symptom.includes(pattern)));
        const score = matchedPatterns.length * 2 + item.commonSymptoms.filter((symptom) => normalizedSymptoms.includes(normalizeText(symptom))).length;
        return { item, score, matchedPatterns };
    });
    const bestMatch = scored.sort((a, b) => b.score - a.score)[0];
    return bestMatch && bestMatch.score > 0 ? bestMatch.item : diseaseKnowledgeBase[0];
}
function getPossibleConditions(text, symptoms) {
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
    return matches.length > 0 ? matches : [diseaseKnowledgeBase[0].name];
}
function parseDuration(source) {
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
function classifySeverity(text, fallback = 5) {
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
function extractSymptomsFromText(notes, selectedSymptoms) {
    const text = normalizeText(notes);
    const candidates = new Set(selectedSymptoms.map(formatSymptomName).filter(Boolean));
    symptomProfiles.forEach((profile) => {
        profile.patterns.forEach((pattern) => {
            if (text.includes(pattern)) {
                const matched = profile.matchedSymptoms.map(normalizeText).find((symptom) => symptom.includes(pattern));
                if (matched) {
                    candidates.add(matched);
                }
                else {
                    candidates.add(pattern);
                }
            }
        });
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
function buildHomeCareRecommendations(profile, duration) {
    const recommendations = new Set(profile.homeCare ?? [
        "Stay hydrated with water or ORS.",
        "Rest comfortably and avoid strenuous activity.",
        "Keep your environment cool and well-ventilated.",
        "Use simple home remedies like warm compresses and gentle stretching.",
        "Track symptoms and note any new warning signs."
    ]);
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
function getDynamicWarning(condition, baseWarning, severity, duration) {
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
function getDynamicDosage(baseDosage, severity) {
    if (severity >= 8) {
        return [
            ...baseDosage,
            { label: "Caution", value: "Severe symptoms. Do not exceed recommended dosage; seek clinical evaluation." }
        ];
    }
    return baseDosage;
}
function buildGeneralWarnings(profile, severity, duration) {
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
function shouldConsultDoctor(profile, severity, duration) {
    return severity >= 8 || duration === "2+ weeks" || /infection|suspected bacterial|flu-like|migraine|chest pain|difficulty breathing/i.test(profile.condition);
}
function calculateConfidence(confidenceValue, severity, duration) {
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
function buildSafetyChecks(profile = {}, recommendedMedicines, severity = 5, duration = "2-3 days") {
    const allergies = (profile.allergies ?? []).map(normalizeText);
    const medications = (profile.medications ?? []).map(normalizeText);
    const checks = [];
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
    recommendedMedicines.forEach((medicine) => {
        allergyRules.forEach((rule) => {
            if (allergies.includes(rule.allergy) && rule.medicineIds.includes(medicine.id)) {
                checks.push({ type: "allergy", medicineId: medicine.id, message: rule.message });
            }
        });
        interactionRules.forEach((rule) => {
            if (rule.medicineIds.includes(medicine.id) && medications.some((med) => rule.userMedPatterns.some((pattern) => med.includes(pattern)))) {
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
    }
    else if (severity >= 6) {
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
    }
    else if (duration === "1 week") {
        checks.push({
            type: "general",
            message: "Symptoms lasting a week - Please monitor and seek medical advice if not improving."
        });
    }
    return checks;
}
export function analyzeSymptomInput(payload, profile = {}) {
    const selectedSymptoms = payload.symptoms?.map((symptom) => normalizeText(symptom)).filter(Boolean) ?? [];
    const notes = normalizeText(payload.notes);
    const parsedDuration = payload.duration ? normalizeText(payload.duration) : parseDuration(notes);
    const parsedSeverity = payload.severity ?? classifySeverity(notes, 5);
    const extractedSymptoms = extractSymptomsFromText(notes, selectedSymptoms);
    const searchText = `${extractedSymptoms.join(" ")} ${notes}`.trim();
    const profileMatch = findSymptomProfile(searchText, extractedSymptoms);
    const recommendedMedicines = getMedicinesByIds(profileMatch.recommendedMedicineIds);
    const safetyChecks = buildSafetyChecks(profile, recommendedMedicines, parsedSeverity, parsedDuration);
    const confidenceNumber = calculateConfidence(profileMatch.baselineConfidence, parsedSeverity, parsedDuration);
    const analysis = {
        symptoms: extractedSymptoms,
        detectedSymptoms: extractedSymptoms,
        duration: parsedDuration,
        severity: `${parsedSeverity}/10`,
        possibleConditions: getPossibleConditions(searchText, extractedSymptoms),
        possibleDiseases: getPossibleConditions(searchText, extractedSymptoms),
        medicines: recommendedMedicines.map((medicine) => medicine.name),
        recommendedMedicines: recommendedMedicines.map((medicine) => medicine.name),
        homeCare: buildHomeCareRecommendations(profileMatch, parsedDuration),
        warnings: buildGeneralWarnings(profileMatch, parsedSeverity, parsedDuration),
        consultDoctor: shouldConsultDoctor(profileMatch, parsedSeverity, parsedDuration),
        confidence: confidenceNumber
    };
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
            matchedSymptoms: extractedSymptoms.length > 0 ? extractedSymptoms : profileMatch.matchedSymptoms ?? profileMatch.commonSymptoms,
            warning: getDynamicWarning(profileMatch.condition, profileMatch.warning, parsedSeverity, parsedDuration),
            dosage: getDynamicDosage(profileMatch.dosage, parsedSeverity),
            safetyChecks
        },
        recommendedMedicines,
        analysis
    };
}
