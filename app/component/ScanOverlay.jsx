// Inspiration from https://github.com/friyiajr/ExpoQRTutorial/blob/main/app/scanner/Overlay.tsx
import { Canvas, DiffRect, rect, rrect } from "@shopify/react-native-skia";
import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

// Make the scan area responsive - 70% of smaller dimension
const innerDimension = Math.min(width, height) * 0.7;

// Position the scan area slightly higher than center for better camera view
const scanAreaTop = height * 0.35; // 35% from top

const outer = rrect(rect(0, 0, width, height), 0, 0);
const inner = rrect(
  rect(
    width / 2 - innerDimension / 2,
    scanAreaTop,
    innerDimension,
    innerDimension
  ),
  20,
  20
);

export const ScanOverlay = () => {
  return (
    <Canvas
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <DiffRect inner={inner} outer={outer} color="black" opacity={0.6} />
    </Canvas>
  );
};

// Default export to satisfy Expo Router
export default ScanOverlay;