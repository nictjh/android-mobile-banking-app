import { Alert, View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { encryptText, decryptText } from '../crypto/cryptoHelperKS';
import {
  StorageAccessFramework as SAF
} from "expo-file-system";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/login'); // Redirect to login page
    }
  };

  const handleEncrypt = async () => {
    const filename = 'encrypted_KEYSTORE.txt';
    const textToEncrypt = "Hello, World!";
    const { cipherText, iv } = await encryptText(textToEncrypt);

    const permissions = await SAF.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      Alert.alert('Permission required', 'Cannot save without directory access.');
      return;
    }
    const uri = await SAF.createFileAsync(permissions.directoryUri, filename, 'text/plain');
    if (!uri) {
      Alert.alert('Error', 'Could not create file in selected directory.');
      return;
    }
    await SAF.writeAsStringAsync(uri, JSON.stringify({ cipherText, iv }));
    Alert.alert('Success', `Encrypted text saved to ${filename}`);
  }

  const handleDecrypt = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/plain',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      Alert.alert('Cancelled', 'No file selected');
      return;
    }

    const fileUri = result.assets[0].uri;
    const encryptedData = await FileSystem.readAsStringAsync(fileUri);
    const { cipherText, iv } = JSON.parse(encryptedData);
    const plain = await decryptText(cipherText, iv);
    Alert.alert('Decrypted Text', plain);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You have successfully logged in!</Text>
      <Button title="Logout" onPress={() => handleLogout()} />
      <Button title="Encrypt" onPress={() => handleEncrypt()} />
      <Button title="Decrypt" onPress={() => handleDecrypt()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'lightgreen', // Added line
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
});
