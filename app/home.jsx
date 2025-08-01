import { Alert, View, Text, Button, StyleSheet } from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import RNFS from 'react-native-fs';

export default function Home() {
  const router = useRouter();

  const requestPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version < 30) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/'); // Redirect to login page
    }
  };

    const testWrite = async () => {
        const hasPermission = await requestPermission();

        const sharedPath = `${RNFS.ExternalStorageDirectoryPath}/Download/test_shared.txt`;
        const appPath = `${RNFS.ExternalDirectoryPath}/test_app_specific.txt`;
        console.log("Resolved path:", sharedPath);
        console.log("Resolved path:", appPath);

        let messages = [];

        if (hasPermission) {
        // Attempt to write to shared Download dir
        try {
            await RNFS.writeFile(sharedPath, 'This is shared external storage', 'utf8');
            messages.push(`✅ Shared write: ${sharedPath}`);
        } catch (e) {
            messages.push(`❌ Shared write failed: ${e.message}`);
        }
        }

        // Always allowed: write to app-specific external dir
        try {
            await RNFS.writeFile(appPath, 'This is app-specific external storage', 'utf8');
            messages.push(`✅ App-specific write: ${appPath}`);
        } catch (e) {
            messages.push(`❌ App-specific write failed: ${e.message}`);
        }

        Alert.alert('Write Results', messages.join('\n'));
    };

    const testScopedStorage = async () => {
        const sharedDownloadDir = '/storage/emulated/0/Download';
        const foreignFile = `${sharedDownloadDir}/secret_from_adb.txt`;

        let messages = [];

        // List all visible files in /Download
        try {
            const files = await RNFS.readDir(sharedDownloadDir);
            const visibleNames = files.map(f => f.name);
            messages.push(`📂 Visible in Download:\n${visibleNames.join('\n')}`);
        } catch (e) {
            messages.push(`Failed to read directory: ${e.message}`);
        }

        // Try reading the foreign file (placed by ADB, not owned by my app)
        try {
            const content = await RNFS.readFile(foreignFile, 'utf8');
            messages.push(`Unexpectedly read foreign file:\n${content}`);
        } catch (e) {
            messages.push(`❗❗ Expected failure reading:\n\n${e.message}`);
        }

        Alert.alert('Scoped Storage Test', messages.join('\n\n'));
        };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You have successfully logged in!</Text>
      <Button title="Logout" onPress={handleLogout} />
      <Button title="Try Writing Files" onPress={testWrite} />
      <Button title="Test Scoped Storage" onPress={testScopedStorage} />
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
