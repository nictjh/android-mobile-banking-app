// lib/supabase.jsx
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";

const loggingFetch = async (input, init) => {
    console.log("➡️ REQUEST:", input, init);
    const response = await fetch(input, init);
    return response;
};

const options = {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    global: {
        fetch: loggingFetch, // 👈 hook into Supabase’s HTTP calls
    },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
