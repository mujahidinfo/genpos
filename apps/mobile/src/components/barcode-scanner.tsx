import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import { useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Retail product codes plus QR. Fewer types = faster, fewer false reads.
const BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'];

/** Four L-shaped brackets frame the target instead of a hard rectangle. */
const CORNER = { borderRadius: 4, borderWidth: 0 };
const CORNERS = [
  { key: 'tl', style: { ...CORNER, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 } },
  { key: 'tr', style: { ...CORNER, top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 } },
  { key: 'bl', style: { ...CORNER, bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 } },
  { key: 'br', style: { ...CORNER, bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 } },
];

/** The same code is ignored for this long, so one item held under the lens isn't counted 5×. */
const REPEAT_GUARD_MS = 1500;

export function BarcodeScanner({
  onScan,
  active,
  height = 200,
  overlay,
}: {
  onScan: (code: string) => void;
  /** Pause the camera (and battery drain) when the screen isn't visible. */
  active: boolean;
  height?: number;
  /** Status text etc. drawn over the bottom of the viewfinder. */
  overlay?: ReactNode;
}) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  // The hook's state can lag behind the system dialog on Android (the activity
  // pauses while it is shown), so trust the request's own result as well.
  const [justGranted, setJustGranted] = useState(false);
  const granted = permission?.granted || justGranted;

  const askForCamera = async () => {
    const result = await requestPermission();
    if (result.granted) setJustGranted(true);
  };
  const last = useRef<{ code: string; at: number } | null>(null);

  const handleScan = ({ data }: { data: string }) => {
    const code = data.trim();
    if (!code) return;
    const now = Date.now();
    if (last.current?.code === code && now - last.current.at < REPEAT_GUARD_MS) return;
    last.current = { code, at: now };
    onScan(code);
  };

  const frame = [styles.frame, { height, backgroundColor: theme.backgroundSelected }];

  if (!permission && !justGranted) {
    return (
      <View style={[frame, styles.center]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!granted) {
    return (
      <View style={[frame, styles.center, styles.permission]}>
        <ThemedText type="smallBold">Scan barcodes with your camera</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Point at a product and it goes straight into the cart.
        </ThemedText>
        {permission?.canAskAgain !== false ? (
          <Button title="Turn on camera" onPress={askForCamera} />
        ) : (
          <Button title="Open settings" variant="secondary" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  return (
    <View style={frame}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        active={active}
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        onBarcodeScanned={active ? handleScan : undefined}
      />
      {/* Aim guide */}
      <View pointerEvents="none" style={styles.guideWrap}>
        <View style={styles.guide}>
          {CORNERS.map((corner) => (
            <View key={corner.key} style={[styles.corner, corner.style, { borderColor: theme.onPrimary }]} />
          ))}
        </View>
      </View>
      {overlay && (
        <View pointerEvents="none" style={styles.overlay}>
          {overlay}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: {
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  guideWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    width: '72%',
    height: '50%',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    opacity: 0.95,
  },
  overlay: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    bottom: Spacing.two,
    alignItems: 'center',
  },
});
