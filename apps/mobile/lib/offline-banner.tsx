import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type OfflineBannerProps = {
  message?: string;
  visible: boolean;
  onDismiss?: () => void;
  variant?: "offline" | "error" | "warning";
};

const VARIANT_STYLES: Record<
  NonNullable<OfflineBannerProps["variant"]>,
  { bg: string; border: string; icon: string; textColor: string }
> = {
  offline: {
    bg: "#1e293b",
    border: "#334155",
    icon: "📡",
    textColor: "#e2e8f0"
  },
  error: {
    bg: "#450a0a",
    border: "#7f1d1d",
    icon: "⚠️",
    textColor: "#fecaca"
  },
  warning: {
    bg: "#451a03",
    border: "#78350f",
    icon: "🔔",
    textColor: "#fde68a"
  }
};

export function OfflineBanner({
  message = "You are offline. Showing cached data.",
  visible,
  onDismiss,
  variant = "offline"
}: OfflineBannerProps) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const v = VARIANT_STYLES[variant];

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.inner}>
        <Text style={styles.icon}>{v.icon}</Text>
        <Text style={[styles.message, { color: v.textColor }]} numberOfLines={2}>
          {message}
        </Text>
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            style={styles.dismissBtn}
            accessibilityLabel="Dismiss notification"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.dismissText, { color: v.textColor }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden"
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10
  },
  icon: {
    fontSize: 18
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18
  },
  dismissBtn: {
    padding: 2
  },
  dismissText: {
    fontWeight: "800",
    fontSize: 14
  }
});
