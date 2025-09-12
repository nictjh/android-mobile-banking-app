import 'react-native-get-random-values';
import * as Keychain from 'react-native-keychain';
import { v4 as uuidv4 } from 'uuid';

let inMemoryDeviceId = null;

export async function getDeviceId() {
    console.log("🔍 getDeviceId called, inMemoryDeviceId:", inMemoryDeviceId);

    if (inMemoryDeviceId) return inMemoryDeviceId;

    // Try read from secure storage
    console.log("🔍 Reading from keychain...");
    const creds = await Keychain.getGenericPassword({ service: 'device_id' });
    console.log("🔍 Keychain result:", creds);

    if (creds?.password) {
        inMemoryDeviceId = creds.password;
        console.log("🔍 Found existing device ID:", inMemoryDeviceId);
        return inMemoryDeviceId;
    }

    // Create, persist, cache
    console.log("🔍 Creating new device ID...");
    const newId = uuidv4();
    console.log("🔍 Generated ID:", newId);

    await Keychain.setGenericPassword('device', newId, { service: 'device_id' });
    console.log("🔍 Saved to keychain");

    inMemoryDeviceId = newId;
    return inMemoryDeviceId;

}