// services/NotificationService.js
import messaging from "@react-native-firebase/messaging";
import { supabase } from "../supabase";

class NotificationService {
    constructor() {
        this.init();
    }

    async init() {
        console.log("Initializing NotificationService...");

        // Request permission for notifications
        await this.requestPermission();

        // Get FCM token
        await this.getFCMToken();

        // Set up foreground message handler
        this.setupForegroundHandler();

        // Set up background message handler
        this.setupBackgroundHandler();
    }

    async requestPermission() {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log("✅ Notification permission granted");
        } else {
            console.log("❌ Notification permission denied");
        }
        return enabled;
    }

    async getFCMToken() {
        try {
            // Check if device supports messaging
            if (!messaging.isDeviceRegisteredForRemoteMessages) {
                await messaging().registerDeviceForRemoteMessages();
            }

            const token = await messaging().getToken();
            console.log("🔑 FCM Token:", token);

            // Store token in Supabase for the current user
            await this.storeFCMToken(token);

            // Listen for token refresh
            messaging().onTokenRefresh(async (newToken) => {
                console.log("🔄 FCM Token refreshed:", newToken);
                await this.storeFCMToken(newToken);
            });

            return token;
        } catch (error) {
            console.error("❌ Error getting FCM token:", error);
        }
    }

    async storeFCMToken(token) {
        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            console.log("🦉 Current user:", user);

            if (userError) {
                console.error("❌ Error getting user:", userError);
                return;
            }

            if (!user) {
                console.log("⚠️ No authenticated user found");
                return;
            }

            // Get the user's customer_id from customer's table
            const { data: customer, error: customerIdError } = await supabase
                .from("customers")
                .select("customer_id")
                .eq("auth_user_id", user.id)
                .single();

            console.log("🦉 Customer:", customer);

            if (customerIdError) {
                console.error("❌ Error getting customer ID:", customerIdError);
                return;
            }

            // Get the user's account_id from account_parties table
            const { data: account, error: accountIdError } = await supabase
                .from("account_parties")
                .select("account_id")
                .eq("customer_id", customer.customer_id)
                .single();

            console.log("🦉 Account:", account);

            if (accountIdError) {
                console.error("❌ Error getting account ID:", accountIdError);
                return;
            }

            // Store or update FCM token in user_devices table
            const { error } = await supabase.from("user_devices").upsert(
                {
                    user_id: user.id,
                    account_id: account.account_id,
                    fcm_token: token,
                    platform: "android",
                    is_active: true,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id,platform",
                }
            );

            if (error) {
                console.error("❌ Error storing FCM token:", error);
            } else {
                console.log("✅ FCM token stored successfully");
            }
        } catch (error) {
            console.error("❌ Error in storeFCMToken:", error);
        }
    }

    setupForegroundHandler() {
        // Handle notifications when app is in foreground
        messaging().onMessage(async (remoteMessage) => {
            console.log("📱 Foreground notification received:", remoteMessage);

            // You can show an in-app notification here
            // For now, just log it
        });
    }

    setupBackgroundHandler() {
        // Handle notifications when app is in background or quit
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
            console.log("📱 Background notification received:", remoteMessage);
        });
    }

    async getInitialNotification() {
        // Handle notification that opened the app
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
            console.log(
                "🚀 App opened from notification:",
                initialNotification
            );
            // Handle the notification data here
            return initialNotification;
        }
        return null;
    }
}

export default new NotificationService();
