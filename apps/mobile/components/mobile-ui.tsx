import { Link, useRouter } from "expo-router";
import {
  aiResult,
  bottomNavRoutes,
  categories,
  medicines,
  notifications,
  orders,
  symptomChips,
  symptomDurations,
  userProfile
} from "@medicare/core";
import type { AppSnapshot, SymptomSafetyCheck } from "@medicare/api-client";
import {
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
  Platform,
  Animated,
  Easing,
} from "react-native";
import React, { useState, memo, useCallback, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import { useCart } from "../lib/use-cart";
import { useAuth } from "../lib/use-auth";

// ─── Premium Design Tokens ───────────────────────────────────────────────────
const C = {
  navy: "#0F172A",
  navyMid: "#1E3A5F",
  cyan: "#06B6D4",
  cyanLight: "#CFFAFE",
  cyanDark: "#0891B2",
  cyanGlow: "rgba(6,182,212,0.15)",
  violet: "#8B5CF6",
  violetLight: "#EDE9FE",
  violetDark: "#7C3AED",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  rose: "#F43F5E",
  roseLight: "#FFE4E6",
  green: "#10B981",
  greenLight: "#D1FAE5",
  white: "#FFFFFF",
  sky: "#F0F9FF",
  skyMid: "#E0F2FE",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  shadow: "rgba(6,182,212,0.12)",
};

function getTagStyle(tag?: string): { bg: string; text: string; border: string } {
  const t = (tag || "General").toLowerCase();
  if (t === "rx") return { bg: C.violetLight, text: C.violetDark, border: C.violet };
  if (t === "otc") return { bg: C.cyanLight, text: C.cyanDark, border: C.cyan };
  if (t === "wellness") return { bg: C.amberLight, text: "#92400E", border: C.amber };
  return { bg: C.greenLight, text: "#065F46", border: C.green };
}

function getOrderStatusStyle(status?: string): { bg: string; text: string } {
  const s = (status || "pending").toLowerCase();
  if (s.includes("transit") || s.includes("ship")) return { bg: C.cyanLight, text: C.cyanDark };
  if (s.includes("deliver") || s.includes("complet")) return { bg: C.greenLight, text: "#065F46" };
  if (s.includes("pend") || s.includes("process")) return { bg: C.amberLight, text: "#92400E" };
  if (s.includes("cancel") || s.includes("fail")) return { bg: C.roseLight, text: "#9F1239" };
  return { bg: C.slate100, text: C.slate700 };
}

const categoryColors = [
  { bg: "rgba(6,182,212,0.1)", border: C.cyanDark },
  { bg: "rgba(139,92,246,0.1)", border: C.violet },
  { bg: "rgba(245,158,11,0.1)", border: C.amber },
  { bg: "rgba(244,63,94,0.1)", border: C.rose },
  { bg: "rgba(16,185,129,0.1)", border: C.green },
  { bg: "rgba(6,182,212,0.08)", border: C.cyan },
];

type MobileSymptomAnalysis = {
  result: {
    condition: string;
    confidence: string;
    matchedSymptoms: string[];
    warning: string;
    dosage: { label: string; value: string }[];
    safetyChecks?: SymptomSafetyCheck[];
  };
  recommendedMedicines: typeof medicines;
};

// ─── Primitive: FadeInView ────────────────────────────────────────────────────
// Replaces MotiView for entrance animations using only react-native Animated.
function FadeInView({
  children,
  style,
  delay = 0,
  initY = 0,
  initX = 0,
  initScale = 1,
}: {
  children: React.ReactNode;
  style?: any;
  delay?: number;
  initY?: number;
  initX?: number;
  initScale?: number;
}) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(initY));
  const [translateX] = useState(() => new Animated.Value(initX));
  const [scale] = useState(() => new Animated.Value(initScale));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
      } as any),
      Animated.spring(translateX, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
      } as any),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        damping: 20,
        stiffness: 220,
      } as any),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY }, { translateX }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Primitive: AnimPressable ─────────────────────────────────────────────────
// Scale-down spring on press, scale-back on release. Works with Expo Go.
export function AnimPressable({
  children,
  onPress,
  style,
  scaleTo = 0.94,
  disabled,
  onPressIn: externalIn,
  onPressOut: externalOut,
  ...rest
}: React.ComponentProps<typeof Pressable> & { scaleTo?: number }) {
  const [scale] = useState(() => new Animated.Value(1));
  const springIn = useCallback(() => {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, damping: 15, stiffness: 400 } as any).start();
  }, [scaleTo]);
  const springOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 400 } as any).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={(e) => { springIn(); externalIn?.(e); }}
        onPressOut={(e) => { springOut(); externalOut?.(e); }}
        onPress={onPress}
        style={style}
        disabled={disabled}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── Primitive: ShimmerBox ────────────────────────────────────────────────────
function ShimmerBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: C.slate200, opacity },
        style,
      ]}
    />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "error" | "success" | "warning" | "info";
type ToastProps = {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  onRetry?: () => void;
  duration?: number;
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string; retryBg: string }> = {
  error: { bg: "#1C0A0A", border: "#7F1D1D", icon: "⚠️", text: "#FCA5A5", retryBg: "rgba(252,165,165,0.15)" },
  success: { bg: "#052E16", border: "#14532D", icon: "✅", text: "#86EFAC", retryBg: "rgba(134,239,172,0.15)" },
  warning: { bg: "#1C0F00", border: "#78350F", icon: "🔔", text: "#FDE68A", retryBg: "rgba(253,230,138,0.15)" },
  info: { bg: "#0C1A2E", border: "#1E3A5F", icon: "ℹ️", text: "#93C5FD", retryBg: "rgba(147,197,253,0.15)" },
};

export function Toast({ visible, message, type = "error", onDismiss, onRetry, duration = 4000 }: ToastProps) {
  const [translateY] = useState(() => new Animated.Value(120));
  const [opacity] = useState(() => new Animated.Value(0));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 120, useNativeDriver: true, damping: 18, stiffness: 280 } as any),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  }, [onDismiss, translateY, opacity]);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 280 } as any),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    if (duration > 0) timerRef.current = setTimeout(hide, duration);
  }, [duration, hide, translateY, opacity]);

  useEffect(() => {
    if (visible) show(); else hide();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, show, hide]);

  const col = TOAST_COLORS[type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { backgroundColor: col.bg, borderColor: col.border },
        { transform: [{ translateY }], opacity },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents={visible ? "auto" : "none"}
    >
      <Text style={styles.toastIcon}>{col.icon}</Text>
      <Text style={[styles.toastMessage, { color: col.text }]} numberOfLines={3}>{message}</Text>
      <View style={styles.toastActions}>
        {onRetry && (
          <AnimPressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRetry(); }}
            style={[styles.toastRetryBtn, { backgroundColor: col.retryBg, borderColor: col.border }]}
          >
            <Text style={[styles.toastRetryText, { color: col.text }]}>Retry</Text>
          </AnimPressable>
        )}
        <AnimPressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); hide(); }}
          style={styles.toastDismissBtn}
        >
          <Text style={[styles.toastDismissText, { color: col.text }]}>✕</Text>
        </AnimPressable>
      </View>
    </Animated.View>
  );
}

// ─── Skeleton Exports ─────────────────────────────────────────────────────────
export function MedicineCardSkeleton() {
  return (
    <View style={[styles.medicineCard, { overflow: "hidden" }]}>
      <View style={[styles.medicineAccentStrip, { backgroundColor: C.slate200 }]} />
      <View style={[styles.medicineIconWrapper, { backgroundColor: C.slate100 }]}>
        <ShimmerBox width={28} height={28} borderRadius={8} />
      </View>
      <View style={[styles.medicineInfo, { gap: 6 }]}>
        <ShimmerBox width="70%" height={14} borderRadius={6} />
        <ShimmerBox width="45%" height={11} borderRadius={6} />
        <ShimmerBox width="85%" height={11} borderRadius={6} />
      </View>
      <View style={[styles.medicineMeta, { gap: 10 }]}>
        <ShimmerBox width={40} height={20} borderRadius={999} />
        <ShimmerBox width={48} height={14} borderRadius={6} />
        <ShimmerBox width={68} height={32} borderRadius={10} />
      </View>
    </View>
  );
}

export function CategoryCardSkeleton() {
  return (
    <View style={styles.categoryGrid}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.categoryCard}>
          <ShimmerBox width={44} height={44} borderRadius={14} />
          <ShimmerBox width="75%" height={11} borderRadius={6} />
          <ShimmerBox width="50%" height={10} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

export function AnalyzingIndicator() {
  const [spin] = useState(() => new Animated.Value(0));
  const [s1] = useState(() => new Animated.Value(0.25));
  const [s2] = useState(() => new Animated.Value(0.25));
  const [s3] = useState(() => new Animated.Value(0.25));

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.linear })
    );
    const makeShimmer = (val: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(val, { toValue: 0.85, duration: 700, delay, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0.25, duration: 700, useNativeDriver: true }),
      ]));
    spinLoop.start();
    makeShimmer(s1, 0).start();
    makeShimmer(s2, 150).start();
    makeShimmer(s3, 300).start();
    return () => { spinLoop.stop(); };
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <FadeInView initY={8} style={styles.analyzingCard}>
      <View style={styles.analyzingRow}>
        <Animated.View style={[styles.analyzingSpinner, { transform: [{ rotate }] }]}>
          <Text style={{ fontSize: 18 }}>🔬</Text>
        </Animated.View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.analyzingText}>Analysing your symptoms with AI...</Text>
          <Text style={styles.analyzingSubtext}>
            Checking for interactions, conditions, and safe medicine recommendations
          </Text>
        </View>
      </View>
      <View style={styles.shimmerBarRow}>
        <Animated.View style={[styles.shimmerBar, { width: "100%", opacity: s1 }]} />
        <Animated.View style={[styles.shimmerBar, { width: "70%", opacity: s2 }]} />
        <Animated.View style={[styles.shimmerBar, { width: "50%", opacity: s3 }]} />
      </View>
    </FadeInView>
  );
}

// ─── MobileScreen ─────────────────────────────────────────────────────────────
export function MobileScreen({
  title,
  subtitle,
  activePath,
  children
}: {
  title: string;
  subtitle?: string;
  activePath: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const profileName = user?.name || "Ravi Kumar";
  const initials = profileName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerOuter}>
        <View style={styles.headerGlowBall} />
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View style={styles.appNameBadge}>
              <Text style={styles.headerAppName}>✚ MediCare AI</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Link asChild href="/cart">
                <AnimPressable
                  scaleTo={0.88}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={styles.headerCartButton}
                >
                  <Text style={styles.headerCartIcon}>🛒</Text>
                  {itemCount > 0 && (
                    <View style={styles.headerCartBadge}>
                      <Text style={styles.headerCartBadgeText}>{itemCount}</Text>
                    </View>
                  )}
                </AnimPressable>
              </Link>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Centered Floating Scan Action Button (PhonePe Style) */}
      <View style={styles.floatingScanWrapper} pointerEvents="box-none">
        <Link asChild href="/prescriptions-upload">
          <AnimPressable
            scaleTo={0.9}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={styles.floatingScanBtn}
          >
            <Text style={styles.floatingScanIcon}>📷</Text>
          </AnimPressable>
        </Link>
      </View>

      <View style={styles.navBar}>
        {bottomNavRoutes.map((route) => {
          const active = route.path === activePath;
          const mobilePath =
            route.path === "/"
              ? "/"
              : route.path === "/prescriptions/upload"
                ? "/prescriptions-upload"
                : route.path;
          return (
            <Link asChild href={mobilePath as never} key={route.path}>
              <AnimPressable
                scaleTo={0.88}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={StyleSheet.flatten([styles.navItem, active && styles.navItemActive])}
              >
                <Text style={StyleSheet.flatten([styles.navItemIcon, active ? styles.navIconActive : styles.navIconInactive])}>
                  {route.icon}
                </Text>
                <Text style={StyleSheet.flatten([styles.navItemLabel, active ? styles.navLabelActive : styles.navLabelInactive])}>
                  {route.label}
                </Text>
                {active && <View style={styles.navActiveDot} />}
              </AnimPressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, soft, style }: { children: React.ReactNode; soft?: boolean; style?: any }) {
  return (
    <View style={[styles.card, soft ? styles.cardSoft : styles.cardDefault, style]}>
      {children}
    </View>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function Hero({ title, description, cta }: { title: string; description: string; cta: string }) {
  return (
    <FadeInView initY={12} style={styles.heroContainer}>
      <View style={styles.heroGlow} />
      <View style={styles.heroInner}>
        <View style={styles.heroTagRow}>
          <Text style={styles.heroTag}>🤖 AI Symptom Checker</Text>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>BETA</Text></View>
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroDescription}>{description}</Text>
        <View style={styles.heroCtaOuter}>
          <View style={styles.heroCtaButton}><Text style={styles.heroCtaText}>{cta}</Text></View>
        </View>
      </View>
    </FadeInView>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitleText}>{title.toUpperCase()}</Text>
      {action ? <Text style={styles.sectionTitleAction}>{action} →</Text> : null}
    </View>
  );
}

// ─── CategoryCards ────────────────────────────────────────────────────────────
export const CategoryCards = memo(function CategoryCards({
  selectedId = null,
  onSelect
}: {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  return (
    <View style={styles.categoryGrid}>
      {categories.map((category, idx) => {
        const isSelected = category.id === selectedId;
        const col = categoryColors[idx % categoryColors.length];
        return (
          <FadeInView key={category.id} initY={10} initScale={0.9} delay={idx * 45}>
            <AnimPressable
              scaleTo={0.93}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect && onSelect(isSelected ? null : category.id);
              }}
              style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
            >
              <View style={[styles.categoryIconWrapper, { backgroundColor: col.bg, borderColor: col.border }]}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
              <Text style={[styles.categoryName, isSelected && { color: C.cyanDark }]}>{category.name}</Text>
              <Text style={styles.categoryCount}>{category.count}</Text>
            </AnimPressable>
          </FadeInView>
        );
      })}
    </View>
  );
});

// ─── Add-to-Cart Button ───────────────────────────────────────────────────────
function AddToCartButton({
  qty,
  isFlashing,
  onPress,
}: {
  qty: number;
  isFlashing: boolean;
  onPress: (e: any) => void;
}) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (qty > 0) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, damping: 10, stiffness: 500 } as any),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 400 } as any),
      ]).start();
    }
  }, [qty]);

  const isAdded = qty > 0 || isFlashing;

  return (
    <AnimPressable
      scaleTo={0.88}
      onPress={onPress}
      style={[styles.addToCartButton, isAdded && styles.addedButton]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={styles.addToCartButtonText}>
          {isFlashing ? "✓ Added" : qty > 0 ? `✓ ${qty}` : "+ Add"}
        </Text>
      </Animated.View>
    </AnimPressable>
  );
}

// ─── Medicine Detail Modal ────────────────────────────────────────────────────
function MediDetailModal({
  medicine,
  onClose,
  onAddToCart,
}: {
  medicine: (typeof medicines)[number];
  onClose: () => void;
  onAddToCart: () => void;
}) {
  const ts = getTagStyle(medicine.tag);
  return (
    <View style={styles.modalOverlay}>
      <FadeInView initY={40} style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>{medicine.name}</Text>
            <Text style={styles.modalBrand}>{medicine.brand}</Text>
          </View>
          <AnimPressable
            scaleTo={0.88}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </AnimPressable>
        </View>
        <View style={styles.modalBadgeRow}>
          <View style={[styles.medicineTagBadge, { backgroundColor: ts.bg, borderColor: ts.border }]}>
            <Text style={[styles.medicineTagText, { color: ts.text }]}>{medicine.tag}</Text>
          </View>
          <Text style={styles.modalPriceText}>{medicine.price}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          {[
            { label: "Description", value: medicine.description },
            { label: "Active Ingredients", value: "Contains standardized micro-active core elements." },
            { label: "Recommended Dosage", value: "Take 1 tablet every 8 hours or as advised by a qualified physician." },
            { label: "Potential Side Effects", value: "Mild headache, temporary nausea, or light drowsiness." },
            { label: "Contraindications", value: "Avoid if you have previous history of severe hepatic/renal impairment." },
          ].map((section) => (
            <View key={section.label} style={styles.modalSection}>
              <Text style={styles.modalLabel}>{section.label}</Text>
              <Text style={styles.modalValue}>{section.value}</Text>
            </View>
          ))}
          {(medicine.tag || "").toLowerCase() === "rx" && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningBannerText}>⚠️ Prescription Required: Upload a valid Rx prescription at checkout to complete purchase.</Text>
            </View>
          )}
        </ScrollView>
        <AnimPressable scaleTo={0.96} onPress={onAddToCart} style={styles.modalAddToCartBtn}>
          <Text style={styles.modalAddToCartBtnText}>🛒  Add to Cart</Text>
        </AnimPressable>
      </FadeInView>
    </View>
  );
}

// ─── MedicineCards ────────────────────────────────────────────────────────────
export const MedicineCards = memo(function MedicineCards({
  items = medicines.slice(0, 4)
}: {
  items?: typeof medicines;
}) {
  const { addItem, items: cartItems } = useCart();
  const [detailMedicine, setDetailMedicine] = useState<(typeof medicines)[number] | null>(null);
  const [successFlashId, setSuccessFlashId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [retryMed, setRetryMed] = useState<(typeof medicines)[number] | null>(null);

  const handleAddToCart = useCallback(async (med: (typeof medicines)[number]) => {
    // Directive 1: Optimistic — fire haptic & show success state immediately
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSuccessFlashId(med.id);
    try {
      await addItem(med, 1);
      setTimeout(() => setSuccessFlashId(null), 700);
    } catch {
      setSuccessFlashId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToastMessage("Couldn't add to cart. Check your connection.");
      setRetryMed(med);
      setToastVisible(true);
    }
  }, [addItem]);

  return (
    <View style={styles.listGap}>
      {items.map((medicine, idx) => {
        const isInCart = cartItems.find((i) => i.medicineId === medicine.id);
        const qty = isInCart ? isInCart.quantity : 0;
        const tagStyle = getTagStyle(medicine.tag);
        const isFlashing = successFlashId === medicine.id;

        return (
          <FadeInView key={medicine.id} initY={18} delay={idx * 60}>
            <AnimPressable
              scaleTo={0.97}
              onPress={() => setDetailMedicine(medicine)}
              style={styles.medicineCard}
            >
              <View style={[styles.medicineAccentStrip, { backgroundColor: tagStyle.border }]} />
              <View style={styles.medicineIconWrapper}>
                <Text style={styles.medicineIcon}>💊</Text>
              </View>
              <View style={styles.medicineInfo}>
                <Text style={styles.medicineName}>{medicine.name}</Text>
                <Text style={styles.medicineBrand}>{medicine.brand}</Text>
                <Text style={styles.medicineDesc} numberOfLines={1}>{medicine.description}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.starText}>⭐ 4.8</Text>
                  <Text style={styles.reviewText}>(32 reviews)</Text>
                </View>
              </View>
              <View style={styles.medicineMeta}>
                <View style={[styles.medicineTagBadge, { backgroundColor: tagStyle.bg, borderColor: tagStyle.border }]}>
                  <Text style={[styles.medicineTagText, { color: tagStyle.text }]}>{medicine.tag || "General"}</Text>
                </View>
                <Text style={styles.medicinePrice}>{medicine.price}</Text>
                <AddToCartButton
                  qty={qty}
                  isFlashing={isFlashing}
                  onPress={(e) => { e.stopPropagation(); handleAddToCart(medicine); }}
                />
              </View>
            </AnimPressable>
          </FadeInView>
        );
      })}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="error"
        onDismiss={() => { setToastVisible(false); setRetryMed(null); }}
        onRetry={retryMed ? () => { setToastVisible(false); handleAddToCart(retryMed!); } : undefined}
      />

      {detailMedicine && (
        <Modal animationType="slide" transparent={true} visible={true} onRequestClose={() => setDetailMedicine(null)}>
          <MediDetailModal
            medicine={detailMedicine}
            onClose={() => setDetailMedicine(null)}
            onAddToCart={() => {
              handleAddToCart(detailMedicine);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setDetailMedicine(null);
            }}
          />
        </Modal>
      )}
    </View>
  );
});

// ─── NotificationCards ────────────────────────────────────────────────────────
export const NotificationCards = memo(function NotificationCards() {
  return (
    <View style={styles.listGap}>
      {notifications.map((item, idx) => (
        <FadeInView key={item.id} initX={-16} delay={idx * 55} style={styles.notificationCard}>
          <View style={styles.notificationIconCircle}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>{item.time}</Text>
          </View>
          <View style={styles.notificationDot} />
        </FadeInView>
      ))}
    </View>
  );
});

// ─── OrderCards ───────────────────────────────────────────────────────────────
export const OrderCards = memo(function OrderCards({ items = orders }: { items?: AppSnapshot["orders"] }) {
  return (
    <View style={styles.listGap}>
      {items.map((order, idx) => {
        const statusStyle = getOrderStatusStyle(order.status);
        return (
          <FadeInView key={order.id} initY={14} delay={idx * 60} style={styles.orderCard}>
            <View style={styles.orderCardTop}>
              <View style={styles.orderIconCircle}>
                <Text style={{ fontSize: 18 }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderIdText}>{order.id}</Text>
                <Text style={styles.orderMutedText}>{order.items.join(" • ")}</Text>
              </View>
              <View style={[styles.orderStatusTag, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.orderStatusText, { color: statusStyle.text }]}>{order.status}</Text>
              </View>
            </View>
            <View style={styles.orderCardBottom}>
              <Text style={styles.orderPharmacyText}>🏥 {order.pharmacy}</Text>
              <Text style={styles.orderEtaText}>🕒 {order.eta}</Text>
            </View>
          </FadeInView>
        );
      })}
    </View>
  );
});

// ─── SymptomInputBlock ────────────────────────────────────────────────────────
export function SymptomInputBlock({
  onAnalyze
}: {
  onAnalyze: (payload: { symptoms: string[]; duration: string; severity: number; notes: string }) => void;
}) {
  const [notes, setNotes] = useState("Fever for 2 days, body pain, headache...");
  const [duration, setDuration] = useState("2-3 days");
  const [severity, setSeverity] = useState(7);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["Fever", "Headache", "Body Pain"]);

  function toggleSymptom(symptom: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSymptoms((cur) =>
      cur.includes(symptom) ? cur.filter((s) => s !== symptom) : [...cur, symptom]
    );
  }

  return (
    <View style={styles.listGap}>
      {/* Symptom chips */}
      <View style={styles.rowWrap}>
        {symptomChips.map((symptom) => {
          const isSelected = selectedSymptoms.includes(symptom.label);
          return (
            <AnimPressable
              key={symptom.label}
              scaleTo={0.92}
              onPress={() => toggleSymptom(symptom.label)}
              style={[styles.symptomChip, isSelected ? styles.symptomChipActive : styles.symptomChipInactive]}
            >
              <Text style={[styles.chipText, isSelected ? styles.textWhite : styles.textInk]}>
                {symptom.label}
              </Text>
            </AnimPressable>
          );
        })}
      </View>

      {/* Notes input */}
      <View style={styles.listGapSmall}>
        <Text style={styles.labelText}>Describe symptoms</Text>
        <TextInput
          multiline
          numberOfLines={5}
          value={notes}
          onChangeText={setNotes}
          placeholder="Fever for 2 days, body pain, headache..."
          placeholderTextColor={C.slate400}
          style={styles.symptomNotesInput}
        />
      </View>

      {/* Duration chips */}
      <View style={styles.rowWrap}>
        {symptomDurations.map((item) => {
          const isSelected = item === duration;
          return (
            <AnimPressable
              key={item}
              scaleTo={0.92}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDuration(item);
              }}
              style={[styles.durationChip, isSelected ? styles.durationChipActive : styles.durationChipInactive]}
            >
              <Text style={[styles.chipText, isSelected ? styles.textWhite : styles.textInk]}>{item}</Text>
            </AnimPressable>
          );
        })}
      </View>

      {/* Severity bar */}
      <View>
        <Text style={styles.labelText}>Severity: {severity}/10</Text>
        <View style={styles.severityBar}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSeverity(i + 1);
              }}
              style={[
                styles.severitySegment,
                i < severity && { backgroundColor: i < 3 ? C.green : i < 7 ? C.amber : C.rose },
              ]}
              hitSlop={{ top: 8, bottom: 8 }}
            />
          ))}
        </View>
      </View>

      <AnimPressable
        scaleTo={0.96}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onAnalyze({ symptoms: selectedSymptoms, duration, severity, notes });
        }}
        style={styles.analyzeButton}
      >
        <Text style={styles.analyzeButtonText}>🔬  Analyse Symptoms</Text>
      </AnimPressable>
    </View>
  );
}

// ─── AIResultBlock ────────────────────────────────────────────────────────────
export function AIResultBlock({ analysis }: { analysis?: MobileSymptomAnalysis }) {
  const result: MobileSymptomAnalysis["result"] = analysis?.result ?? {
    ...aiResult,
    safetyChecks: []
  };

  return (
    <FadeInView initY={20} style={styles.aiResultContainer}>
      <View style={styles.aiResultGlow} />
      <View style={styles.aiResultInner}>
        <View style={styles.aiResultTagRow}>
          <Text style={styles.aiResultTag}>🤖 AI Detected</Text>
          <FadeInView delay={200} style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{result.confidence}</Text>
          </FadeInView>
        </View>
        <Text style={styles.aiResultCondition}>{result.condition}</Text>
        <Text style={styles.aiResultSub}>Matched: {result.matchedSymptoms.join(" • ")}</Text>
        <View style={styles.aiResultWarningContainer}>
          <Text style={styles.aiResultWarningText}>⚠️ {result.warning}</Text>
        </View>
        {result.safetyChecks?.length ? (
          <View style={styles.aiResultSafetyContainer}>
            <Text style={styles.aiResultSafetyHeader}>Safety Checks</Text>
            {result.safetyChecks.map((check: typeof result.safetyChecks[number], index: number) => (
              <FadeInView key={index} initX={-8} delay={index * 80}>
                <Text style={styles.aiResultSafetyItem}>✓ {check.message}</Text>
              </FadeInView>
            ))}
          </View>
        ) : null}
      </View>
    </FadeInView>
  );
}

// ─── ProfileBlocks ────────────────────────────────────────────────────────────
export const ProfileBlocks = memo(function ProfileBlocks() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const profile = user || {
    name: userProfile.name,
    email: userProfile.email,
    phone: "+91 9999900000",
    DOB: "1994-06-15",
    allergies: userProfile.allergies,
    conditions: userProfile.chronicConditions,
    medications: userProfile.currentMedications
  };

  const getInitials = (nameStr: string) =>
    nameStr.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={styles.listGap}>
      {/* Profile Hero */}
      <FadeInView initScale={0.95} style={styles.profileHeroCard}>
        <View style={styles.profileAvatarGradient}>
          <Text style={styles.profileAvatarText}>{getInitials(profile.name)}</Text>
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileEmailText}>{profile.email}</Text>
        <Text style={styles.profileEmailText}>{profile.phone || "No phone added"}</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12, justifyContent: "center" }}>
          <AnimPressable
            scaleTo={0.95}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/profile/edit");
            }}
            style={styles.editProfileInlineBtn}
          >
            <Text style={styles.editProfileInlineBtnText}>✏️  Edit Profile</Text>
          </AnimPressable>
          <AnimPressable
            scaleTo={0.95}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await logout();
              router.replace("/login");
            }}
            style={[styles.editProfileInlineBtn, { backgroundColor: "#fee2e2", borderColor: "#fca5a5" }]}
          >
            <Text style={[styles.editProfileInlineBtnText, { color: "#dc2626" }]}>🚪  Log Out</Text>
          </AnimPressable>
        </View>
      </FadeInView>

      {/* Stat Cards */}
      <View style={styles.profileStatsRow}>
        {[
          { icon: "🎂", label: "DOB", value: profile.DOB || "Not set", border: C.cyan },
          { icon: "🩸", label: "Blood", value: "O+ (Mock)", border: C.rose },
          { icon: "💊", label: "Meds", value: `${profile.medications?.length ?? 0} active`, border: C.violet },
        ].map((stat, idx) => (
          <FadeInView key={stat.label} initY={12} delay={idx * 70} style={[styles.profileStatCard, { borderColor: stat.border }]}>
            <Text style={styles.profileStatIcon}>{stat.icon}</Text>
            <Text style={styles.profileStatValue}>{stat.label}</Text>
            <Text style={styles.profileStatLabel}>{stat.value}</Text>
          </FadeInView>
        ))}
      </View>

      <SectionTitle title="Chronic Conditions" />
      {profile.conditions && profile.conditions.length > 0 ? (
        profile.conditions.map((item: string, idx: number) => (
          <FadeInView key={item} initX={-12} delay={idx * 50} style={styles.conditionTag}>
            <Text style={styles.conditionIcon}>⚕</Text>
            <Text style={styles.conditionText}>{item}</Text>
          </FadeInView>
        ))
      ) : (
        <Card soft><Text style={styles.profileMutedText}>No chronic conditions added.</Text></Card>
      )}

      <SectionTitle title="Current Medications" />
      {profile.medications && profile.medications.length > 0 ? (
        profile.medications.map((item: string, idx: number) => (
          <FadeInView key={item} initX={-12} delay={idx * 50} style={styles.medicationTag}>
            <Text style={styles.medicationIcon}>💊</Text>
            <Text style={styles.medicationText}>{item}</Text>
          </FadeInView>
        ))
      ) : (
        <Card><Text style={styles.profileMutedText}>No regular medications listed.</Text></Card>
      )}

      <SectionTitle title="Allergies" />
      {profile.allergies && profile.allergies.length > 0 ? (
        profile.allergies.map((item: string, idx: number) => (
          <FadeInView key={item} initX={-12} delay={idx * 50} style={styles.allergyTag}>
            <Text style={styles.allergyIcon}>⚠️</Text>
            <Text style={styles.allergyText}>{item}</Text>
          </FadeInView>
        ))
      ) : (
        <Card><Text style={styles.profileMutedText}>No allergies declared.</Text></Card>
      )}
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: C.sky },
  headerOuter: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: C.navy, position: "relative", overflow: "hidden" },
  headerGlowBall: { position: "absolute", right: -40, top: -20, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(6,182,212,0.18)" },
  headerContent: { gap: 6 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  appNameBadge: { backgroundColor: "rgba(6,182,212,0.2)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(6,182,212,0.4)" },
  headerAppName: { color: C.cyan, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(6,182,212,0.3)", borderWidth: 2, borderColor: C.cyan, alignItems: "center", justifyContent: "center" },
  avatarText: { color: C.white, fontWeight: "800", fontSize: 16 },
  headerTitle: { color: C.white, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 20, marginTop: 2 },
  scrollContent: { padding: 16, gap: 16 },
  navBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 8, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.slate200 },
  navItem: { alignItems: "center", justifyContent: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, gap: 2, position: "relative" },
  navItemActive: { backgroundColor: "rgba(6,182,212,0.08)" },
  navItemInactive: { backgroundColor: C.white },
  navItemIcon: { fontSize: 20 },
  navIconActive: { color: C.cyan },
  navIconInactive: { color: C.slate400 },
  navItemLabel: { fontSize: 10, fontWeight: "600" },
  navLabelActive: { color: C.cyanDark },
  navLabelInactive: { color: C.slate400 },
  navActiveDot: { position: "absolute", bottom: -2, width: 4, height: 4, borderRadius: 2, backgroundColor: C.cyan },
  textActive: { color: C.cyan },
  textInactive: { color: C.slate400 },
  card: { borderRadius: 20, padding: 16, gap: 10 },
  cardDefault: { backgroundColor: C.white, shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
  cardSoft: { backgroundColor: "#F0FDFA", borderWidth: 1, borderColor: "rgba(6,182,212,0.2)" },
  heroContainer: { borderRadius: 20, overflow: "hidden", backgroundColor: C.navy, position: "relative" },
  heroGlow: { position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(6,182,212,0.2)" },
  heroInner: { padding: 20, gap: 10 },
  heroTagRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroTag: { color: C.cyan, fontSize: 12, fontWeight: "700" },
  heroBadge: { backgroundColor: "rgba(139,92,246,0.3)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.violet },
  heroBadgeText: { color: C.violet, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: C.white, fontSize: 20, fontWeight: "800", letterSpacing: -0.3, lineHeight: 28 },
  heroDescription: { color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 20 },
  heroCtaOuter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  heroCtaButton: { backgroundColor: C.cyan, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  heroCtaText: { color: C.navy, fontWeight: "800", fontSize: 13 },
  heroStatPill: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  heroStatText: { color: C.white, fontSize: 12, fontWeight: "600" },
  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sectionTitleText: { fontSize: 11, fontWeight: "800", color: C.slate500, letterSpacing: 1.2 },
  sectionTitleAction: { fontSize: 13, fontWeight: "700", color: C.cyan },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: { width: "30%", minWidth: 96, backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.slate200, padding: 12, alignItems: "center", gap: 6, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  categoryCardActive: { borderColor: C.cyan },
  categoryIconWrapper: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  categoryIconWrapperActive: { backgroundColor: C.white },
  categoryIconText: { fontSize: 20 },
  categoryName: { fontSize: 12, fontWeight: "700", color: C.slate800, textAlign: "center" },
  categoryCount: { fontSize: 11, color: C.slate400, fontWeight: "600" },
  listGap: { gap: 12 },
  listGapSmall: { gap: 8 },
  medicineCard: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200, flexDirection: "row", alignItems: "center", overflow: "hidden", shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  medicineAccentStrip: { width: 4, alignSelf: "stretch" },
  medicineIconWrapper: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.cyanLight, alignItems: "center", justifyContent: "center", margin: 12 },
  medicineIcon: { fontSize: 22 },
  medicineInfo: { flex: 1, gap: 3, paddingVertical: 12 },
  medicineName: { fontSize: 14, fontWeight: "700", color: C.slate900 },
  medicineBrand: { fontSize: 12, color: C.slate400 },
  medicineDesc: { fontSize: 12, color: C.slate500 },
  medicineMeta: { alignItems: "flex-end", gap: 8, padding: 12 },
  medicineTagBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  medicineTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  medicineTag: { color: C.cyanDark, backgroundColor: C.cyanLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontSize: 11, fontWeight: "700" },
  medicinePrice: { fontSize: 14, fontWeight: "800", color: C.cyanDark },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  starText: { fontSize: 11, color: C.amber, fontWeight: "700" },
  reviewText: { fontSize: 11, color: C.slate400 },
  addToCartButton: { backgroundColor: C.cyan, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignItems: "center", justifyContent: "center", minWidth: 68 },
  addToCartButtonText: { color: C.navy, fontSize: 12, fontWeight: "800" },
  addedButton: { backgroundColor: C.green },
  notificationCard: { backgroundColor: C.white, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderColor: C.slate200, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  notificationIconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.cyanGlow, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(6,182,212,0.3)" },
  notificationTitle: { fontSize: 13, fontWeight: "700", color: C.slate900 },
  notificationMessage: { color: C.slate500, fontSize: 12, lineHeight: 18, marginTop: 2 },
  notificationTime: { fontSize: 11, color: C.slate400, marginTop: 4, fontWeight: "600" },
  notificationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.cyan, marginTop: 4 },
  orderCard: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200, overflow: "hidden", shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  orderCardTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  orderIconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.sky, alignItems: "center", justifyContent: "center" },
  orderIdText: { fontSize: 13, fontWeight: "700", color: C.slate900 },
  orderMutedText: { fontSize: 12, color: C.slate500, marginTop: 2 },
  orderStatusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  orderStatusText: { fontSize: 11, fontWeight: "700" },
  orderCardBottom: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.sky, borderTopWidth: 1, borderTopColor: C.slate100 },
  orderPharmacyText: { fontSize: 12, color: C.slate500 },
  orderEtaText: { fontSize: 12, color: C.cyanDark, fontWeight: "700" },
  orderHeaderRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  symptomChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  symptomChipActive: { borderColor: C.cyan, backgroundColor: C.cyan },
  symptomChipInactive: { borderColor: C.slate300, backgroundColor: C.white },
  chipText: { fontSize: 13, fontWeight: "600" },
  textWhite: { color: C.white },
  textInk: { color: C.slate800 },
  labelText: { fontSize: 14, fontWeight: "700", color: C.slate800 },
  symptomNotesInput: { borderWidth: 1.5, borderColor: C.cyan, borderRadius: 16, backgroundColor: C.white, padding: 14, textAlignVertical: "top", color: C.slate900, fontSize: 14 },
  durationChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5 },
  durationChipActive: { backgroundColor: C.violet, borderColor: C.violet },
  durationChipInactive: { backgroundColor: C.white, borderColor: C.slate300 },
  inputContainer: { marginTop: 6 },
  severityInput: { borderWidth: 1, borderColor: C.slate300, borderRadius: 16, backgroundColor: C.white, padding: 12 },
  severityBar: { flexDirection: "row", gap: 4, marginTop: 10 },
  severitySegment: { flex: 1, height: 10, borderRadius: 5, backgroundColor: C.slate200 },
  analyzeButton: { backgroundColor: C.navy, borderRadius: 16, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.cyan },
  analyzeButtonText: { color: C.cyan, fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  analyzingCard: { backgroundColor: "#F0FDF9", borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: "#BBF7D0" },
  analyzingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  analyzingSpinner: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  analyzingText: { color: "#065F46", fontWeight: "700", fontSize: 14 },
  analyzingSubtext: { color: C.slate500, fontSize: 12, lineHeight: 16 },
  shimmerBarRow: { gap: 6 },
  shimmerBar: { height: 8, borderRadius: 4, backgroundColor: "#BBF7D0" },
  aiResultContainer: { borderRadius: 20, overflow: "hidden", backgroundColor: C.navy, position: "relative" },
  aiResultGlow: { position: "absolute", top: -20, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(6,182,212,0.15)" },
  aiResultInner: { padding: 18, gap: 10 },
  aiResultTagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  aiResultTag: { color: C.cyan, fontWeight: "700", fontSize: 13 },
  confidenceBadge: { backgroundColor: "rgba(6,182,212,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(6,182,212,0.5)" },
  confidenceText: { color: C.cyan, fontSize: 11, fontWeight: "700" },
  aiResultCondition: { color: C.white, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  aiResultSub: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  aiResultWarningContainer: { backgroundColor: "rgba(244,63,94,0.15)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(244,63,94,0.3)" },
  aiResultWarningText: { color: "#FFB3C1", lineHeight: 20, fontSize: 13 },
  aiResultSafetyContainer: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 },
  aiResultSafetyHeader: { color: C.white, fontWeight: "700", marginBottom: 6, fontSize: 13 },
  aiResultSafetyItem: { color: "rgba(255,255,255,0.75)", lineHeight: 20, fontSize: 12 },
  profileHeroCard: { backgroundColor: C.white, borderRadius: 24, padding: 20, alignItems: "center", gap: 8, shadowColor: C.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 16, elevation: 4 },
  profileAvatarGradient: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.navy, borderWidth: 3, borderColor: C.cyan, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  profileAvatarText: { color: C.cyan, fontWeight: "900", fontSize: 28 },
  profileName: { textAlign: "center", fontSize: 20, fontWeight: "800", color: C.slate900 },
  profileEmailText: { textAlign: "center", color: C.slate500, fontSize: 13 },
  profileStatsRow: { flexDirection: "row", gap: 10 },
  profileStatCard: { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 12, alignItems: "center", gap: 4, borderWidth: 1.5, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  profileStatIcon: { fontSize: 20 },
  profileStatValue: { fontSize: 12, fontWeight: "800", color: C.slate800 },
  profileStatLabel: { fontSize: 11, color: C.slate500, textAlign: "center" },
  conditionTag: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#BBF7D0" },
  conditionIcon: { fontSize: 16 },
  conditionText: { fontWeight: "700", color: "#065F46", fontSize: 13 },
  medicationTag: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.cyanGlow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(6,182,212,0.25)" },
  medicationIcon: { fontSize: 16 },
  medicationText: { fontWeight: "700", color: C.cyanDark, fontSize: 13 },
  allergyTag: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.roseLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FECDD3" },
  allergyIcon: { fontSize: 16 },
  allergyText: { fontWeight: "700", color: "#9F1239", fontSize: 13 },
  profileMutedText: { color: C.slate400, fontSize: 13 },
  profileAvatar: { width: 74, height: 74, borderRadius: 24, backgroundColor: C.cyanLight, alignSelf: "center", alignItems: "center", justifyContent: "center" },
  profileFactsRow: { flexDirection: "row", gap: 12 },
  profileFactValue: { fontSize: 20, fontWeight: "800", color: C.cyanDark },
  profileFactLabel: { color: C.slate500 },
  profileConditionText: { fontWeight: "700", color: "#065F46" },
  profileMedicationText: { fontWeight: "700", color: C.cyanDark },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "88%", padding: 20, gap: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate300, alignSelf: "center", marginBottom: 4 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: C.slate900, flex: 1, letterSpacing: -0.3 },
  modalBrand: { fontSize: 13, color: C.slate400, marginTop: 2 },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.slate100, alignItems: "center", justifyContent: "center" },
  closeButtonText: { fontSize: 14, color: C.slate500, fontWeight: "700" },
  modalScroll: { gap: 16, paddingBottom: 24 },
  modalBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalPriceText: { fontSize: 20, fontWeight: "900", color: C.cyanDark },
  modalSection: { gap: 6 },
  modalLabel: { fontSize: 12, fontWeight: "800", color: C.slate800, textTransform: "uppercase", letterSpacing: 0.5 },
  modalValue: { fontSize: 13, color: C.slate500, lineHeight: 20 },
  warningBanner: { backgroundColor: C.amberLight, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#FDE68A" },
  warningBannerText: { color: "#78350F", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  modalAddToCartBtn: { backgroundColor: C.navy, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: C.cyan },
  modalAddToCartBtnText: { color: C.cyan, fontSize: 15, fontWeight: "800" },
  editProfileInlineBtn: { backgroundColor: "rgba(6,182,212,0.1)", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8, borderWidth: 1, borderColor: "rgba(6,182,212,0.3)" },
  editProfileInlineBtnText: { color: C.cyanDark, fontWeight: "700", fontSize: 13 },
  toastContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 16,
    right: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  toastIcon: { fontSize: 18 },
  toastMessage: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  toastActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  toastRetryBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  toastRetryText: { fontSize: 12, fontWeight: "800" },
  toastDismissBtn: { padding: 2 },
  toastDismissText: { fontSize: 14, fontWeight: "800" },
  headerCartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerCartIcon: {
    fontSize: 18,
  },
  headerCartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: C.rose,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.navy,
  },
  headerCartBadgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
  floatingScanWrapper: {
    position: "absolute",
    bottom: 74,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  floatingScanBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: C.cyan,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: C.white,
  },
  floatingScanIcon: {
    fontSize: 26,
    color: C.white,
  },
});
