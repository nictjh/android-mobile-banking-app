import { Alert, View, Text, Button, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { encryptText, decryptText } from '../crypto/cryptoHelper';
import * as MediaLibrary from 'expo-media-library'; // This one has to request for specific permissions because you are writing to media library
import * as FileSystem from 'expo-file-system';
import {
  StorageAccessFramework as SAF
} from "expo-file-system";
import * as DocumentPicker from 'expo-document-picker'; // This is the one that uses SAF

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/login'); // Redirect to login page
    }
  };

  const handleEncryptAndSave = async () => {
    try {

      const rawText = 'This is a sensitive log to be encrypted';
      const encrypted = await encryptText(rawText);
      const filename = 'encrypted_log.txt';

      // User to pick a directory
      const permissions = await SAF.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert('Permission required', 'Cannot save without directory access.');
        return;
      }

      const uri = await SAF.createFileAsync( // Creates the file
        permissions.directoryUri,
        filename,
        'text/plain'
      );
      if (!uri) {
        Alert.alert('Error', 'Could not create file in selected directory.');
        return;
      }

      // Write encrypted content to the file
      await FileSystem.writeAsStringAsync(uri, encrypted);

      Alert.alert('Success', 'Encrypted file saved successfully!');
    } catch (error) {
      console.error('Error saving encrypted file:', error);
      Alert.alert('Failed to save file', error.message || String(error));
    }

  }

  const handleReadAndDecrypt = async () => {
    try {
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
      const decrypted = await decryptText(encryptedData);
      Alert.alert('Decrypted Text', decrypted);

    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>You have successfully logged in!</Text>
      <Button title="Encrypt & Save Text" onPress={() => handleEncryptAndSave()} />
      <Button title="Decrypt from File" onPress={() => handleReadAndDecrypt()} />
      <Button title="Logout" onPress={() => handleLogout()} />
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
