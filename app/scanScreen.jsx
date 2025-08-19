import { Camera, useCameraDevice, useCodeScanner, useCameraPermission } from "react-native-vision-camera";
import { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ScanOverlay} from "../app/component/ScanOverlay";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ScanScreen() {

    const router = useRouter();
    const { userAccountNumber, userAccountBalance } = useLocalSearchParams();
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (code) => {
            if (code.length > 0 && !scanned) {
                const value = code[0].value;
                if (value) {
                    console.log("Scanned:", value);
                    setScanned(true);

                    debounceRef.current = setTimeout(() => {
                        setScanned(false);
                    }, 3000); // Reset scanned state after 3 seconds

                    router.push({ pathname: "/localAccCheck", params: { userAccountNumber: userAccountNumber, userAccountBalance: userAccountBalance, recipientAccountNumber: value } });
                }
            }
        }
    });
    const [scanned, setScanned] = useState(false); //debounce flag
    const debounceRef = useRef(null);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    if (!device) {
        return (
            <View>
                <Text>No Camera found on device</Text>
            </View>
        );
    }

    if (!hasPermission) {
        return (
            <View style={styles.center}>
                <Text>Camera permission is required to scan QR codes.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex:1 }}>
            <Camera
                style={{ flex:1 }}
                device={device}
                isActive={true}
                codeScanner={codeScanner}
            />
            <ScanOverlay />
        </View>
    );

}


const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    button: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#007Aff',
        marginTop: 10,
    },
});