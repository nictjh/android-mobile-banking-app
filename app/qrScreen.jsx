import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";

export default function QRScreen() {
    const router = useRouter();
    const { userAccNumber } = useLocalSearchParams();

    if (!userAccNumber) {
        return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
                Error: Account number not provided.
            </Text>
            </View>
        </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>Your QR Code</Text>
                <Text style={styles.subtitle}>
                Share your QR code
                </Text>

                <View style={styles.qrCard}>
                <View style={styles.qrInner}>
                    <QRCode
                    value={String(userAccNumber)}
                    size={260}
                    backgroundColor="white"
                    color="black"
                    logo={require("../assets/ZentraBankLogo.png")}
                    logoSize={60}
                    logoBackgroundColor="transparent"
                    />
                </View>
                </View>
            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safe: {
    flex: 1,
    backgroundColor: "#0B0B0F",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#C9C9CE",
    marginBottom: 16,
  },
  qrCard: {
    borderRadius: 20,
    backgroundColor: "#111116",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  qrInner: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    fontWeight: "600",
  },
});