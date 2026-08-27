import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useRouter } from "expo-router";

// Safe dynamic import to prevent crash in Expo Go / Simulators
let recognizeText: any = null;
try {
  const ocrModule = require("expo-mlkit-ocr");
  recognizeText = ocrModule.recognizeText;
} catch (e) {
  console.log("expo-mlkit-ocr native module not found. OCR will run with mock data fallback.");
}
import * as Haptics from "expo-haptics";
import { MobileScreen, Card } from "../components/mobile-ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTAINER_WIDTH = SCREEN_WIDTH - 32;
const CONTAINER_HEIGHT = 400;

// Premium Color Palette
const C = {
  navy: "#0F172A",
  navyMid: "#1E3A5F",
  cyan: "#06B6D4",
  cyanLight: "#CFFAFE",
  cyanDark: "#0891B2",
  white: "#FFFFFF",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  rose: "#F43F5E",
};

type ScreenState = "permission" | "camera" | "crop" | "ocr" | "results";

export default function PrescriptionsScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScreenState>("camera");
  const cameraRef = useRef<CameraView>(null);

  // Image states
  const [capturedPhoto, setCapturedPhoto] = useState<{ uri: string; width: number; height: number } | null>(null);
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>("");

  // Crop dimensions (relative to displayed container size of CONTAINER_WIDTH x CONTAINER_HEIGHT)
  const [cropTop, setCropTop] = useState(40);
  const [cropLeft, setCropLeft] = useState(30);
  const [cropRight, setCropRight] = useState(30);
  const [cropBottom, setCropBottom] = useState(40);

  const startCoords = useRef({ top: 0, left: 0, right: 0, bottom: 0 });

  // Animation values
  const [laserAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (state === "camera" || state === "ocr") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.setValue(0);
    }
  }, [state]);

  // Request permissions flow
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      Promise.resolve().then(() => {
        setState("permission");
      });
    }
  }, [permission]);

  if (!permission) {
    return (
      <MobileScreen activePath="/prescriptions-scan" title="OCR Scanner">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.cyan} />
        </View>
      </MobileScreen>
    );
  }

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    if (res.granted) {
      setState("camera");
    }
  };

  // Taking photo
  const takePicture = async () => {
    if (cameraRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: false,
        });

        if (photo) {
          setCapturedPhoto({
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
          });
          // Reset crop bounds
          setCropTop(50);
          setCropLeft(40);
          setCropRight(40);
          setCropBottom(50);
          setState("crop");
        }
      } catch (err) {
        console.error("Failed to take picture", err);
      }
    }
  };

  // Pan Responders for Custom Cropper Drag Corners
  const createCornerPan = (
    updateCoords: (gs: { dx: number; dy: number }) => void
  ) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startCoords.current = { top: cropTop, left: cropLeft, right: cropRight, bottom: cropBottom };
      },
      onPanResponderMove: (_, gs) => {
        updateCoords(gs);
      },
    });
  };

  // eslint-disable-next-line react-hooks/refs
  const topLeftPan = createCornerPan((gs) => {
    const newTop = Math.min(Math.max(10, startCoords.current.top + gs.dy), CONTAINER_HEIGHT - cropBottom - 60);
    const newLeft = Math.min(Math.max(10, startCoords.current.left + gs.dx), CONTAINER_WIDTH - cropRight - 60);
    setCropTop(newTop);
    setCropLeft(newLeft);
  });

  // eslint-disable-next-line react-hooks/refs
  const topRightPan = createCornerPan((gs) => {
    const newTop = Math.min(Math.max(10, startCoords.current.top + gs.dy), CONTAINER_HEIGHT - cropBottom - 60);
    const newRight = Math.min(Math.max(10, startCoords.current.right - gs.dx), CONTAINER_WIDTH - cropLeft - 60);
    setCropTop(newTop);
    setCropRight(newRight);
  });

  // eslint-disable-next-line react-hooks/refs
  const bottomLeftPan = createCornerPan((gs) => {
    const newBottom = Math.min(Math.max(10, startCoords.current.bottom - gs.dy), CONTAINER_HEIGHT - cropTop - 60);
    const newLeft = Math.min(Math.max(10, startCoords.current.left + gs.dx), CONTAINER_WIDTH - cropRight - 60);
    setCropBottom(newBottom);
    setCropLeft(newLeft);
  });

  // eslint-disable-next-line react-hooks/refs
  const bottomRightPan = createCornerPan((gs) => {
    const newBottom = Math.min(Math.max(10, startCoords.current.bottom - gs.dy), CONTAINER_HEIGHT - cropTop - 60);
    const newRight = Math.min(Math.max(10, startCoords.current.right - gs.dx), CONTAINER_WIDTH - cropLeft - 60);
    setCropBottom(newBottom);
    setCropRight(newRight);
  });

  // Processing OCR on cropped photo
  const processImageAndOCR = async () => {
    if (!capturedPhoto) return;
    setState("ocr");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Calculate crop box scaled to original image dimensions
      const scaleX = capturedPhoto.width / CONTAINER_WIDTH;
      const scaleY = capturedPhoto.height / CONTAINER_HEIGHT;

      const originX = cropLeft * scaleX;
      const originY = cropTop * scaleY;
      const cropW = (CONTAINER_WIDTH - cropLeft - cropRight) * scaleX;
      const cropH = (CONTAINER_HEIGHT - cropTop - cropBottom) * scaleY;

      // Crop the image
      const cropResult = await manipulateAsync(
        capturedPhoto.uri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropW),
              height: Math.round(cropH),
            },
          },
        ],
        { compress: 0.95, format: SaveFormat.JPEG }
      );

      setCroppedImageUri(cropResult.uri);

      // Perform local on-device OCR using ML Kit if available
      let ocrText = "";
      if (recognizeText) {
        const ocrResult = await recognizeText(cropResult.uri);
        if (ocrResult && ocrResult.blocks) {
          ocrText = ocrResult.blocks.map((block: any) => block.text).join("\n");
        }
      } else {
        // Fallback for Expo Go / Simulator
        ocrText = "Amoxicillin 500mg\nTake 1 capsule three times daily\nQty: 30\nDr. Ravi Kumar\nLicense: LIC-983742-A";
        Alert.alert(
          "Expo Go Fallback Active",
          "Google ML Kit OCR requires a custom native build (npx expo run:android or run:ios). A mock prescription has been loaded for testing.",
          [{ text: "OK" }]
        );
      }
      setRecognizedText(ocrText || "No readable text detected. Please crop closer or try again.");
      setState("results");
    } catch (err) {
      console.error("OCR / Cropping Error:", err);
      setRecognizedText("An error occurred during text extraction. Please try again.");
      setState("results");
    }
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CONTAINER_HEIGHT],
  });

  return (
    <MobileScreen activePath="/prescriptions-scan" title="Smart Rx Scan" subtitle="Instant on-device prescription OCR">
      
      {state === "permission" && (
        <Card style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDesc}>
            Camera access is required to scan and read medical prescriptions.
          </Text>
          <Pressable style={styles.actionBtn} onPress={handleRequestPermission}>
            <Text style={styles.actionBtnText}>Grant Camera Access</Text>
          </Pressable>
        </Card>
      )}

      {state === "camera" && (
        <View style={styles.mainContainer}>
          <Text style={styles.instructionText}>
            Align the prescription inside the viewfinder and capture.
          </Text>
          
          <View style={styles.viewfinderContainer}>
            <CameraView style={styles.cameraView} ref={cameraRef} />
            <View style={styles.viewfinderBorder} pointerEvents="none" />
            
            {/* Laser scanner line effect */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.laserLine,
                { transform: [{ translateY: laserTranslateY }] },
              ]}
            />
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </Pressable>
            
            <Pressable style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureBtnInner} />
            </Pressable>
          </View>
        </View>
      )}

      {state === "crop" && capturedPhoto && (
        <View style={styles.mainContainer}>
          <Text style={styles.instructionText}>
            Drag the corners to crop out the background and isolate the text.
          </Text>

          <View style={styles.cropperOuter}>
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={styles.cropperImage}
              resizeMode="cover"
            />

            {/* Transparent backdrops */}
            <View style={[styles.cropMask, { top: 0, left: 0, right: 0, height: cropTop }]} />
            <View style={[styles.cropMask, { bottom: 0, left: 0, right: 0, height: cropBottom }]} />
            <View style={[styles.cropMask, { top: cropTop, bottom: cropBottom, left: 0, width: cropLeft }]} />
            <View style={[styles.cropMask, { top: cropTop, bottom: cropBottom, right: 0, width: cropRight }]} />

            {/* Bounding box outline */}
            <View
              style={[
                styles.cropBoundingBox,
                {
                  top: cropTop,
                  left: cropLeft,
                  width: CONTAINER_WIDTH - cropLeft - cropRight,
                  height: CONTAINER_HEIGHT - cropTop - cropBottom,
                },
              ]}
            >
              <View style={styles.cropHelperLinesHorizontal} />
              <View style={styles.cropHelperLinesVertical} />
            </View>

            {/* Drag Handles */}
            <View
              style={[styles.dragHandle, { top: cropTop - 12, left: cropLeft - 12 }]}
              {...topLeftPan.panHandlers}
            >
              <View style={styles.dragHandleInner} />
            </View>

            <View
              style={[styles.dragHandle, { top: cropTop - 12, right: cropRight - 12 }]}
              {...topRightPan.panHandlers}
            >
              <View style={styles.dragHandleInner} />
            </View>

            <View
              style={[styles.dragHandle, { bottom: cropBottom - 12, left: cropLeft - 12 }]}
              {...bottomLeftPan.panHandlers}
            >
              <View style={styles.dragHandleInner} />
            </View>

            <View
              style={[styles.dragHandle, { bottom: cropBottom - 12, right: cropRight - 12 }]}
              {...bottomRightPan.panHandlers}
            >
              <View style={styles.dragHandleInner} />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setState("camera")}
            >
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </Pressable>
            
            <Pressable style={styles.actionBtn} onPress={processImageAndOCR}>
              <Text style={styles.actionBtnText}>Analyze Crop 🚀</Text>
            </Pressable>
          </View>
        </View>
      )}

      {state === "ocr" && (
        <Card style={styles.processingCard}>
          <ActivityIndicator size="large" color={C.cyan} />
          <Text style={styles.processingTitle}>On-Device AI OCR</Text>
          <Text style={styles.processingDesc}>
            Processing and extracting text structure entirely offline...
          </Text>
          <View style={styles.progressLoaderTrack}>
            <Animated.View
              style={[
                styles.progressLoaderLaser,
                { transform: [{ translateY: laserTranslateY.interpolate({
                  inputRange: [0, CONTAINER_HEIGHT],
                  outputRange: [0, 6],
                }) }] },
              ]}
            />
          </View>
        </Card>
      )}

      {state === "results" && (
        <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultHeader}>OCR Extraction Complete</Text>

          {croppedImageUri && (
            <Card style={styles.previewImageCard}>
              <Text style={styles.previewTitle}>Cropped Prescription Isolated Area</Text>
              <Image
                source={{ uri: croppedImageUri }}
                style={styles.croppedPreviewImage}
                resizeMode="contain"
              />
            </Card>
          )}

          <Card style={styles.editorCard}>
            <Text style={styles.editorTitle}>Extracted Text (Edit to Correct)</Text>
            <TextInput
              style={styles.editorInput}
              multiline
              value={recognizedText}
              onChangeText={setRecognizedText}
              placeholder="No text extracted. Write or correct prescription details here."
              placeholderTextColor={C.slate400}
            />
          </Card>

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setState("camera")}
            >
              <Text style={styles.secondaryBtnText}>Scan Again</Text>
            </Pressable>
            
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Saved", "Extracted prescription details saved!");
                router.replace({
                  pathname: "/prescriptions-upload",
                  params: { extractedText: recognizedText }
                });
              }}
            >
              <Text style={styles.actionBtnText}>Use Details</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
    gap: 16,
  },
  permissionCard: {
    backgroundColor: C.navy,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.25)",
  },
  permissionTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  permissionDesc: {
    color: C.slate300,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  instructionText: {
    color: C.slate400,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 12,
  },
  viewfinderContainer: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(6,182,212,0.3)",
    backgroundColor: "#000",
  },
  cameraView: {
    flex: 1,
    position: "relative",
  },
  viewfinderBorder: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 24,
    borderColor: "rgba(15,23,42,0.35)",
  },
  laserLine: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: C.cyan,
    shadowColor: C.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 4,
    borderColor: C.cyan,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.white,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: C.slate800,
  },
  cancelBtnText: {
    color: C.slate300,
    fontWeight: "700",
    fontSize: 14,
  },
  cropperOuter: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: C.navy,
    position: "relative",
  },
  cropperImage: {
    width: "100%",
    height: "100%",
  },
  cropMask: {
    position: "absolute",
    backgroundColor: "rgba(15,23,42,0.68)",
  },
  cropBoundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: C.cyan,
    borderStyle: "dashed",
  },
  cropHelperLinesHorizontal: {
    position: "absolute",
    top: "33.3%",
    bottom: "33.3%",
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(6,182,212,0.3)",
  },
  cropHelperLinesVertical: {
    position: "absolute",
    left: "33.3%",
    right: "33.3%",
    top: 0,
    bottom: 0,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "rgba(6,182,212,0.3)",
  },
  dragHandle: {
    position: "absolute",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  dragHandleInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.cyan,
    borderWidth: 2.5,
    borderColor: C.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.cyan,
  },
  actionBtnText: {
    color: C.cyan,
    fontWeight: "800",
    fontSize: 14,
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: C.slate800,
  },
  secondaryBtnText: {
    color: C.slate300,
    fontWeight: "700",
    fontSize: 14,
  },
  processingCard: {
    backgroundColor: C.navy,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.25)",
  },
  processingTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  processingDesc: {
    color: C.slate400,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  progressLoaderTrack: {
    width: 140,
    height: 6,
    backgroundColor: C.slate800,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressLoaderLaser: {
    width: "40%",
    height: "100%",
    backgroundColor: C.cyan,
    borderRadius: 3,
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    gap: 16,
    paddingBottom: 24,
  },
  resultHeader: {
    fontSize: 18,
    fontWeight: "900",
    color: C.slate900,
    letterSpacing: -0.3,
  },
  previewImageCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 12,
    gap: 10,
  },
  previewTitle: {
    color: C.slate500,
    fontSize: 12,
    fontWeight: "700",
  },
  croppedPreviewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: C.slate100,
  },
  editorCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  editorTitle: {
    color: C.slate800,
    fontSize: 13,
    fontWeight: "700",
  },
  editorInput: {
    borderWidth: 1.5,
    borderColor: C.slate200,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: C.slate900,
    backgroundColor: C.slate100,
    minHeight: 150,
    textAlignVertical: "top",
  },
});
