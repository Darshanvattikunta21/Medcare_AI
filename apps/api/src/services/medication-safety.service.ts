import { medicines } from "@medicare/core";

export type SafetyCheck = {
  type: "allergy" | "interaction" | "duplicate" | "condition" | "general";
  message: string;
  medicineId?: string;
};

type InteractionRule = {
  medicines: string[];
  severity: "high" | "medium";
  message: string;
};

const interactionRules: InteractionRule[] = [
  {
    medicines: ["amoxicillin", "cetirizine"],
    severity: "medium",
    message: "This combination can increase drowsiness and should be reviewed by a pharmacist."
  },
  {
    medicines: ["paracetamol", "ibuprofen"],
    severity: "medium",
    message: "Taking multiple pain relievers together may increase stomach and liver stress."
  },
  {
    medicines: ["aspirin", "ibuprofen"],
    severity: "high",
    message: "Aspirin with ibuprofen may reduce aspirin effectiveness and increase bleeding risk."
  }
];

const allergyRules = [
  { trigger: "penicillin", medicines: ["amoxicillin"], message: "Penicillin allergy may contraindicate amoxicillin." },
  { trigger: "ibuprofen", medicines: ["ibuprofen"], message: "You reported an ibuprofen allergy." }
];

const conditionRules = [
  {
    trigger: "hypertension",
    medicines: ["ibuprofen"],
    message: "Ibuprofen can worsen blood-pressure control in some patients."
  },
  {
    trigger: "asthma",
    medicines: ["aspirin"],
    message: "Aspirin may trigger asthma symptoms in sensitive patients."
  },
  {
    trigger: "gastric ulcer",
    medicines: ["ibuprofen", "aspirin"],
    message: "This medicine can irritate the stomach and may not be suitable with ulcer history."
  }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchMedicineName(name: string) {
  const lowered = normalize(name);
  return medicines.find((item) => lowered.includes(normalize(item.name)) || normalize(item.name).includes(lowered)) ?? null;
}

export function buildSafetyChecks(options: {
  recommendedMedicines: Array<{ id?: string; name: string }>;
  currentMedications?: string[];
  allergies?: string[];
  conditions?: string[];
}) {
  const checks: SafetyCheck[] = [];
  const recommendedNames = options.recommendedMedicines.map((item) => normalize(item.name));
  const activeMedicationNames = (options.currentMedications ?? []).map(normalize);
  const allergyNames = (options.allergies ?? []).map(normalize);
  const conditionNames = (options.conditions ?? []).map(normalize);

  for (const current of activeMedicationNames) {
    if (recommendedNames.some((candidate) => candidate.includes(current) || current.includes(candidate))) {
      checks.push({
        type: "duplicate",
        message: `Possible duplicate therapy detected with your current medication: ${current}.`
      });
    }
  }

  for (const allergyRule of allergyRules) {
    if (!allergyNames.some((item) => item.includes(allergyRule.trigger))) {
      continue;
    }

    for (const medicineName of allergyRule.medicines) {
      const matched = options.recommendedMedicines.find((item) => normalize(item.name).includes(medicineName));
      if (matched) {
        checks.push({
          type: "allergy",
          message: allergyRule.message,
          medicineId: matched.id
        });
      }
    }
  }

  for (const conditionRule of conditionRules) {
    if (!conditionNames.some((item) => item.includes(conditionRule.trigger))) {
      continue;
    }

    for (const medicineName of conditionRule.medicines) {
      const matched = options.recommendedMedicines.find((item) => normalize(item.name).includes(medicineName));
      if (matched) {
        checks.push({
          type: "condition",
          message: conditionRule.message,
          medicineId: matched.id
        });
      }
    }
  }

  const interactionPool = [...recommendedNames, ...activeMedicationNames];
  for (const rule of interactionRules) {
    if (rule.medicines.every((name) => interactionPool.some((item) => item.includes(name)))) {
      checks.push({
        type: "interaction",
        message: rule.message
      });
    }
  }

  if (checks.length === 0) {
    checks.push({
      type: "general",
      message: "No major conflicts were detected in the current rule set, but pharmacist review is still recommended."
    });
  }

  return checks;
}

export function inferMedicineSuggestionsFromText(text: string) {
  const lowered = normalize(text);
  return medicines.filter((item) => lowered.includes(normalize(item.name)));
}

export function resolveMedicineId(name: string) {
  return matchMedicineName(name)?.id;
}
