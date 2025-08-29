import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  SafeAreaView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { insertUserHPcontact } from "../lib/services/userService";

export default function PayNowScreen() {
  const router = useRouter();
  // If you pass these via route params you can consume them here:
  const { userAccountNumber, userAccountBalance, customerid } = useLocalSearchParams();
  console.log(customerid);
  const [consentGiven, setConsentGiven] = useState(false);
  const [phone, setPhone] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={() => router.push("/home")} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Link PayNow</Text>
        </View>

        {/* ===== Phase 1: Consent ===== */}
        {!consentGiven ? (
          <View style={styles.lookupSection}>
            <Text style={styles.sectionTitle}>Enable PayNow</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why link your Mobile Phone number?</Text>
              <Text style={styles.infoBody}>
                Linking lets friends and businesses send you money quickly using your mobile number — no bank details needed.
              </Text>
              <View style={{ height: 8 }} />
              <Text style={styles.infoBullet}>• Secure — managed by your bank</Text>
              <Text style={styles.infoBullet}>• Convenient — no account number needed</Text>
              <Text style={styles.infoBullet}>• You control what’s linked</Text>
            </View>

            <TouchableOpacity
              style={styles.lookupButton}
              onPress={() => setConsentGiven(true)}
            >
              <Text style={styles.lookupButtonText}>Link Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ===== Phase 2: Form ===== */
          <View style={styles.transferSection}>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 91234567"
                keyboardType="phone-pad"
                maxLength={15}
              />
              <Text style={styles.helperText}>Use a number you can receive PayNow on</Text>
            </View>

            {/* Confirm Link */}
            <TouchableOpacity
              style={[
                styles.transferButton,
                (phone.length > 0)
                  ? styles.transferButtonActive
                  : styles.transferButtonDisabled,
              ]}
              onPress={() => {
                // TODO: wire your query / API
                console.log("Link PayNow with:", { phone });
                insertUserHPcontact(customerid, phone); //Once I insert I don't want this page to request permission page to pop
              }}
              disabled={!(phone.length > 0)}
            >
              <Text
                style={[
                  styles.transferButtonText,
                  (phone.length > 0) && styles.transferButtonTextActive,
                ]}
              >
                Confirm Link
              </Text>
            </TouchableOpacity>

            {/* Reset */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setPhone("");
                setConsentGiven(false);
              }}
            >
              <Text style={styles.resetButtonText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== Styles (kept in your visual language) ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: "#3b82f6", fontWeight: "500" },
  title: { fontSize: 24, fontWeight: "600", color: "#1f2937", marginLeft: 16 },

  userAccountSection: { paddingHorizontal: 24, paddingTop: 20 },
  userAccountCard: {
    backgroundColor: "#e0f2fe",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0284c7",
    marginBottom: 16,
  },
  userAccountNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0c4a6e",
    marginBottom: 4,
  },
  userAccountBalance: { fontSize: 14, color: "#075985" },

  lookupSection: { paddingHorizontal: 24, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937", marginBottom: 16 },

  infoCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937", marginBottom: 8 },
  infoBody: { fontSize: 14, color: "#374151" },
  infoBullet: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  inputContainer: { marginBottom: 24, paddingHorizontal: 24, paddingTop: 4 },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  helperText: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  lookupButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 8,
  },
  lookupButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },

  transferSection: { paddingTop: 20 },
  transferButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 16,
  },
  transferButtonDisabled: { backgroundColor: "#e5e7eb" },
  transferButtonActive: { backgroundColor: "#10b981" },
  transferButtonText: { fontSize: 16, fontWeight: "600", color: "#9ca3af" },
  transferButtonTextActive: { color: "#ffffff" },
  resetButton: { paddingVertical: 12, alignItems: "center" },
  resetButtonText: { fontSize: 14, color: "#6b7280", textDecorationLine: "underline" },
});
