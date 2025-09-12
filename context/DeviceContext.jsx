import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDeviceId } from '../lib/deviceId';

const DeviceContext = createContext({ deviceId: null });

export function DeviceProvider({ children }) {
    const [deviceId, setDeviceId] = useState(null);

    useEffect(() => {
        (async () => {
        try {
            const id = await getDeviceId();
            setDeviceId(id);
            console.log("📱 Generated/Loaded Device ID:", id);
        } catch (e) {
            console.warn('Failed to init deviceId', e);
            setDeviceId(null);
        }
        })();
    }, []);

    return (
        <DeviceContext.Provider value={{ deviceId }}>
        {children}
        </DeviceContext.Provider>
    );
}

export function useDevice() {
    return useContext(DeviceContext);
}
