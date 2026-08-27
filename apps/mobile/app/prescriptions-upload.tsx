import React, { useState, useCallback, useEffect } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { verifyPrescriptionOcr, fetchMedicine, getErrorMessage } from "@medicare/api-client";
import type { PrescriptionVerifyResponse } from "@medicare/api-client";
import { MobileScreen, Card, SectionTitle } from "../components/mobile-ui";
import { useCart } from "../lib/use-cart";
import { OfflineBanner } from "../lib/offline-banner";

type PickedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type ScreenState = "idle" | "processing" | "verified" | "rejected" | "error";

export default function PrescriptionsUploadScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const { extractedText } = useLocalSearchParams<{ extractedText?: string }>();

  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [extractedOcrText, setExtractedOcrText] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>("idle");
  const [verifyResult, setVerifyResult] = useState<PrescriptionVerifyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Prefill scanned OCR text if returning from scanner screen
  useEffect(() => {
    if (extractedText) {
      Promise.resolve().then(() => {
        setExtractedOcrText(extractedText);
        setPickedImage({
          uri: "",
          name: "scanned_prescription_ocr.txt",
          mimeType: "text/plain"
        });
        setScreenState("idle");
        setVerifyResult(null);
        setCartAdded(false);
        setErrorMessage(null);
      });
    }
  }, [extractedText]);

  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload a prescription.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to photograph your prescription.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const handlePickFromLibrary = useCallback(async () => {
    const allowed = await requestMediaPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.85,
      base64: false
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() ?? "jpg";
      setPickedImage({
        uri: asset.uri,
        name: asset.fileName ?? `prescription_${Date.now()}.${ext}`,
        mimeType: asset.mimeType ?? `image/${ext}`
      });
      setExtractedOcrText(null);
      setScreenState("idle");
      setVerifyResult(null);
      setCartAdded(false);
      setErrorMessage(null);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const allowed = await requestCameraPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      base64: false
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPickedImage({
        uri: asset.uri,
        name: `prescription_camera_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg"
      });
      setExtractedOcrText(null);
      setScreenState("idle");
      setVerifyResult(null);
      setCartAdded(false);
      setErrorMessage(null);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!pickedImage && !extractedOcrText) {
      Alert.alert("No Image or Text Selected", "Please select, photograph, or scan a prescription first.");
      return;
    }

    setScreenState("processing");
    setErrorMessage(null);
    setShowOfflineBanner(false);

    try {
      const formData = new FormData();
      if (extractedOcrText) {
        formData.append("text", extractedOcrText);
      } else if (pickedImage) {
        formData.append("file", {
          uri: pickedImage.uri,
          name: pickedImage.name,
          type: pickedImage.mimeType
        } as unknown as Blob);
      }

      const result = await verifyPrescriptionOcr(formData);
      setVerifyResult(result);

      if (result.verificationStatus === "VERIFIED") {
        setScreenState("verified");
      } else {
        setScreenState("rejected");
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Unable to verify prescription. Check your connection and try again.");
      const isNetworkError =
        err instanceof Error && (err.message.includes("Network") || err.message.includes("fetch") || err.message.includes("timeout"));
      if (isNetworkError) {
        setShowOfflineBanner(true);
      }
      setErrorMessage(msg);
      setScreenState("error");
    }
  }, [pickedImage, extractedOcrText]);

  const handleAddToCart = useCallback(async () => {
    if (!verifyResult || verifyResult.matchedCatalogIds.length === 0) return;

    setAddingToCart(true);
    try {
      const addPromises = verifyResult.matchedCatalogIds.map(async (catalogId) => {
        try {
          const medicine = await fetchMedicine(catalogId);
          await addItem(
            {
              id: medicine.id,
              name: medicine.name,
              brand: medicine.brand,
              price: medicine.price,
              tag: medicine.tag
            },
            1
          );
        } catch {
          // Individual item failures are silently skipped; partial adds are acceptable
        }
      });

      await Promise.all(addPromises);
      setCartAdded(true);
    } catch {
      setErrorMessage("Some items could not be added to cart. Please try manually.");
    } finally {
      setAddingToCart(false);
    }
  }, [verifyResult, addItem]);

  const isProcessing = screenState === "processing";

  return (
    <MobileScreen
      activePath="/prescriptions/upload"
      title="Upload Prescription"
      subtitle="OCR verification for JPG, PNG, or PDF"
    >
      <OfflineBanner
        visible={showOfflineBanner}
        message="Cannot reach verification server. Please check your connection."
        variant="offline"
        onDismiss={() => setShowOfflineBanner(false)}
      />

      {/* Image drop zone */}
      <Card>
        {extractedOcrText ? (
          <View style={styles.previewContainer}>
            <View style={styles.textOcrPreview}>
              <Text style={styles.textOcrPreviewTitle}>📝 Scanned OCR Text</Text>
              <ScrollView style={styles.textOcrScroll}>
                <Text style={styles.textOcrPreviewText}>{extractedOcrText}</Text>
              </ScrollView>
            </View>
            <Pressable
              onPress={() => {
                setPickedImage(null);
                setExtractedOcrText(null);
                setScreenState("idle");
                setVerifyResult(null);
                setErrorMessage(null);
              }}
              style={styles.removeImageBtn}
            >
              <Text style={styles.removeImageText}>✕ Remove</Text>
            </Pressable>
          </View>
        ) : pickedImage ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: pickedImage.uri }}
              style={styles.previewImage}
              resizeMode="contain"
              accessibilityLabel="Selected prescription image"
            />
            <Text style={styles.previewFileName} numberOfLines={1}>
              {pickedImage.name}
            </Text>
            <Pressable
              onPress={() => {
                setPickedImage(null);
                setScreenState("idle");
                setVerifyResult(null);
                setErrorMessage(null);
              }}
              style={styles.removeImageBtn}
            >
              <Text style={styles.removeImageText}>✕ Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.dropZone}>
            <Text style={styles.dropZoneIcon}>📋</Text>
            <Text style={styles.dropZoneTitle}>Select your prescription</Text>
            <Text style={styles.dropZoneSubtitle}>
              Printed and handwritten prescriptions supported.{"\n"}JPEG · PNG supported.
            </Text>
          </View>
        )}
      </Card>

      {/* Smart Scan button */}
      <Pressable
        onPress={() => router.push("/prescriptions-scan")}
        disabled={isProcessing}
        style={[styles.smartScanBtn, isProcessing && styles.disabledBtn]}
        accessibilityLabel="Use real-time smart scanner"
      >
        <Text style={styles.smartScanBtnText}>⚡ Smart Scanner (On-Device OCR)</Text>
      </Pressable>

      {/* Pick buttons */}
      <View style={styles.pickButtonRow}>
        <Pressable
          onPress={handlePickFromLibrary}
          disabled={isProcessing}
          style={[styles.pickBtn, styles.pickBtnGallery, isProcessing && styles.disabledBtn]}
          accessibilityLabel="Pick from photo library"
        >
          <Text style={styles.pickBtnText}>🖼 Gallery</Text>
        </Pressable>
        <Pressable
          onPress={handleTakePhoto}
          disabled={isProcessing}
          style={[styles.pickBtn, styles.pickBtnCamera, isProcessing && styles.disabledBtn]}
          accessibilityLabel="Take a photo with camera"
        >
          <Text style={styles.pickBtnText}>📷 Camera</Text>
        </Pressable>
      </View>

      {/* Error display */}
      {screenState === "error" && errorMessage ? (
        <Card>
          <Text style={styles.errorTitle}>⚠️ Verification Failed</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
        </Card>
      ) : null}

      {/* VERIFIED result + cart injection banner */}
      {screenState === "verified" && verifyResult ? (
        <>
          <Card>
            <View style={styles.verifiedBadgeRow}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓ VERIFIED</Text>
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(verifyResult.confidenceScore * 100)}%
              </Text>
            </View>
            {verifyResult.message ? (
              <Text style={styles.verifiedMessage}>{verifyResult.message}</Text>
            ) : null}
            <Text style={styles.matchedLabel}>
              {verifyResult.matchedCatalogIds.length} medicine
              {verifyResult.matchedCatalogIds.length !== 1 ? "s" : ""} matched in catalog
            </Text>
          </Card>

          {verifyResult.matchedCatalogIds.length > 0 && !cartAdded ? (
            <View style={styles.cartBanner}>
              <View style={styles.cartBannerTextBlock}>
                <Text style={styles.cartBannerTitle}>💊 Add Prescribed Items to Cart</Text>
                <Text style={styles.cartBannerSubtitle}>
                  {verifyResult.matchedCatalogIds.length} verified medicine
                  {verifyResult.matchedCatalogIds.length !== 1 ? "s" : ""} ready to order
                </Text>
              </View>
              <Pressable
                onPress={handleAddToCart}
                disabled={addingToCart}
                style={[styles.cartBannerBtn, addingToCart && styles.disabledBtn]}
                accessibilityLabel="Add all prescribed medicines to cart"
              >
                {addingToCart ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.cartBannerBtnText}>Add All</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {cartAdded ? (
            <View style={styles.cartSuccessBanner}>
              <Text style={styles.cartSuccessText}>✓ Medicines added to your cart</Text>
              <Pressable onPress={() => router.push("/cart")} style={styles.viewCartBtn}>
                <Text style={styles.viewCartText}>View Cart →</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}

      {/* REJECTED result */}
      {screenState === "rejected" && verifyResult ? (
        <Card>
          <View style={styles.rejectedBadgeRow}>
            <View style={styles.rejectedBadge}>
              <Text style={styles.rejectedBadgeText}>✕ REJECTED</Text>
            </View>
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(verifyResult.confidenceScore * 100)}%
            </Text>
          </View>
          <Text style={styles.rejectedBody}>
            {verifyResult.message ??
              "The prescription could not be verified. Please ensure the image is clear and try again, or contact your pharmacist."}
          </Text>
        </Card>
      ) : null}

      {/* Verify button */}
      <Pressable
        onPress={handleVerify}
        disabled={isProcessing || !pickedImage}
        style={[
          styles.verifyButton,
          (isProcessing || !pickedImage) && styles.disabledBtn
        ]}
        accessibilityLabel="Verify prescription"
      >
        {isProcessing ? (
          <View style={styles.processingRow}>
            <ActivityIndicator color="#ffffff" size="small" />
            <Text style={styles.verifyButtonText}>  Verifying via OCR...</Text>
          </View>
        ) : (
          <Text style={styles.verifyButtonText}>
            {screenState === "idle" ? "Verify Prescription" : "Re-verify"}
          </Text>
        )}
      </Pressable>

      <SectionTitle title="Verification flow" />

      <Card>
        <Text style={styles.flowTitle}>1. Image capture</Text>
        <Text style={styles.flowBody}>
          Select or photograph a clear, well-lit prescription. Both printed and handwritten formats
          are supported.
        </Text>
      </Card>
      <Card>
        <Text style={styles.flowTitle}>2. OCR extraction</Text>
        <Text style={styles.flowBody}>
          Medicine names, dosage, frequency, and doctor details are extracted automatically by the
          OCR engine.
        </Text>
      </Card>
      <Card>
        <Text style={styles.flowTitle}>3. Safety checks & catalog match</Text>
        <Text style={styles.flowBody}>
          Interaction and allergy checks run against your health profile. Matched medicines are
          ready to add to cart in one tap.
        </Text>
      </Card>
    </MobileScreen>
  );
}

const C = {
  green: "#1d9e75",
  greenDark: "#0f6e56",
  greenLight: "#eef9f4",
  greenBorder: "#a7f3d0",
  red: "#dc2626",
  redLight: "#fee2e2",
  redBorder: "#fca5a5",
  gray: "#6b7280",
  grayLight: "#f9fafb",
  grayBorder: "#e5e7eb",
  white: "#ffffff",
  dark: "#111827",
  slate: "#4b5563"
};

const styles = StyleSheet.create({
  dropZone: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 8
  },
  dropZoneIcon: {
    fontSize: 40
  },
  dropZoneTitle: {
    fontWeight: "800",
    color: C.dark,
    fontSize: 15
  },
  dropZoneSubtitle: {
    color: C.gray,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18
  },
  previewContainer: {
    alignItems: "center",
    gap: 10
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: C.grayLight
  },
  previewFileName: {
    color: C.slate,
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "90%"
  },
  removeImageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: C.redBorder
  },
  removeImageText: {
    color: C.red,
    fontWeight: "700",
    fontSize: 12
  },
  pickButtonRow: {
    flexDirection: "row",
    gap: 12
  },
  pickBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5
  },
  pickBtnGallery: {
    backgroundColor: C.grayLight,
    borderColor: C.grayBorder
  },
  pickBtnCamera: {
    backgroundColor: C.greenLight,
    borderColor: C.greenBorder
  },
  pickBtnText: {
    fontWeight: "700",
    fontSize: 13,
    color: C.dark
  },
  errorTitle: {
    fontWeight: "800",
    color: C.red,
    marginBottom: 4
  },
  errorBody: {
    color: C.slate,
    fontSize: 13,
    lineHeight: 18
  },
  verifiedBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  verifiedBadge: {
    backgroundColor: "#d1fae5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.greenBorder
  },
  verifiedBadgeText: {
    color: C.greenDark,
    fontWeight: "800",
    fontSize: 12
  },
  confidenceText: {
    color: C.gray,
    fontSize: 12,
    fontWeight: "600"
  },
  verifiedMessage: {
    color: C.slate,
    fontSize: 13,
    marginBottom: 6
  },
  matchedLabel: {
    color: C.greenDark,
    fontWeight: "700",
    fontSize: 13
  },
  cartBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.4)"
  },
  cartBannerTextBlock: {
    flex: 1,
    gap: 3
  },
  cartBannerTitle: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14
  },
  cartBannerSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12
  },
  cartBannerBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 72,
    alignItems: "center"
  },
  cartBannerBtnText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 13
  },
  cartSuccessBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.greenLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.greenBorder
  },
  cartSuccessText: {
    color: C.greenDark,
    fontWeight: "700",
    fontSize: 13
  },
  viewCartBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.green,
    borderRadius: 10
  },
  viewCartText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 12
  },
  rejectedBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  rejectedBadge: {
    backgroundColor: C.redLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.redBorder
  },
  rejectedBadgeText: {
    color: C.red,
    fontWeight: "800",
    fontSize: 12
  },
  rejectedBody: {
    color: C.slate,
    fontSize: 13,
    lineHeight: 20
  },
  verifyButton: {
    backgroundColor: C.green,
    borderRadius: 14,
    padding: 15,
    alignItems: "center"
  },
  verifyButtonText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 15
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  disabledBtn: {
    opacity: 0.5
  },
  flowTitle: {
    fontWeight: "800",
    color: C.dark,
    marginBottom: 4
  },
  flowBody: {
    color: C.gray,
    fontSize: 13,
    lineHeight: 18
  },
  smartScanBtn: {
    backgroundColor: "#06b6d4",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#0891b2",
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  smartScanBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15
  },
  textOcrPreview: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 14,
    gap: 8
  },
  textOcrPreviewTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569"
  },
  textOcrScroll: {
    maxHeight: 120,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10
  },
  textOcrPreviewText: {
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
  }
});
