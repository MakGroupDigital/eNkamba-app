"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserNotificationCreated = exports.removePushToken = exports.savePushToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
function tokenHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
async function relayToSupabase(userId, notificationId, notif) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey)
        return;
    const baseUrl = supabaseUrl.replace(/\/+$/, '');
    const payload = {
        user_id: userId,
        notification_id: notificationId,
        type: String(notif.type || 'system'),
        title: String(notif.title || 'eNkamba'),
        message: String(notif.message || 'Nouvelle notification'),
        action_url: String(notif.actionUrl || '/dashboard'),
        created_at: new Date().toISOString(),
        metadata: notif,
    };
    try {
        const response = await fetch(`${baseUrl}/rest/v1/notification_events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
                Prefer: 'return=minimal',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const reason = await response.text();
            console.error('Relais Supabase échoué:', response.status, reason);
        }
    }
    catch (error) {
        console.error('Erreur relais Supabase:', error);
    }
}
/**
 * Enregistre (ou met à jour) un token push pour l'utilisateur connecté.
 */
exports.savePushToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    const rawToken = String(data?.token || '').trim();
    if (!rawToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Token push requis');
    }
    const platform = data?.platform || 'web';
    const tokenId = tokenHash(rawToken);
    const ref = db.collection('users').doc(context.auth.uid).collection('pushTokens').doc(tokenId);
    await ref.set({
        token: rawToken,
        platform,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true };
});
/**
 * Supprime un token push (ex: logout, changement appareil).
 */
exports.removePushToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    const rawToken = String(data?.token || '').trim();
    if (!rawToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Token push requis');
    }
    const tokenId = tokenHash(rawToken);
    await db.collection('users').doc(context.auth.uid).collection('pushTokens').doc(tokenId).delete();
    return { success: true };
});
/**
 * Déclenche un push FCM dès qu'une notification est créée en base.
 * Couvre web (PWA) et mobile (APK via FCM natif).
 */
exports.onUserNotificationCreated = functions.firestore
    .document('users/{userId}/notifications/{notificationId}')
    .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const notificationId = context.params.notificationId;
    const notif = snap.data() || {};
    // Redondance: dupliquer aussi l'événement vers Supabase Realtime (si configuré).
    await relayToSupabase(userId, notificationId, notif);
    const tokensSnap = await db.collection('users').doc(userId).collection('pushTokens').get();
    const tokenDocs = tokensSnap.docs.filter((doc) => Boolean(doc.data().token));
    const tokenRecords = tokenDocs.map((doc) => {
        const data = doc.data();
        return {
            ref: doc.ref,
            token: String(data.token),
            platform: String(data.platform || 'web'),
        };
    });
    if (!tokenRecords.length) {
        return null;
    }
    const title = String(notif.title || 'eNkamba');
    const body = String(notif.message || 'Vous avez une nouvelle notification');
    const actionUrl = String(notif.actionUrl || '/dashboard');
    const notificationType = String(notif.type || 'system');
    const isCallNotification = notificationType === 'incoming_call';
    const dataPayload = {
        notificationId,
        type: notificationType,
        title,
        body,
        actionUrl,
    };
    if (notif.transactionId) {
        dataPayload.transactionId = String(notif.transactionId);
    }
    if (notif.requestId) {
        dataPayload.requestId = String(notif.requestId);
    }
    if (notif.callId) {
        dataPayload.callId = String(notif.callId);
    }
    if (notif.callType) {
        dataPayload.callType = String(notif.callType);
    }
    if (notif.conversationId) {
        dataPayload.conversationId = String(notif.conversationId);
    }
    const invalidCodes = new Set([
        'messaging/registration-token-not-registered',
        'messaging/invalid-registration-token',
    ]);
    const cleanupTasks = [];
    const sendToRecords = async (records, message) => {
        if (!records.length)
            return;
        const sendResult = await admin.messaging().sendEachForMulticast({
            tokens: records.map((record) => record.token),
            ...message,
        });
        sendResult.responses.forEach((response, index) => {
            if (response.success || !response.error)
                return;
            if (!invalidCodes.has(response.error.code))
                return;
            cleanupTasks.push(records[index].ref.delete());
        });
    };
    const androidRecords = tokenRecords.filter((record) => record.platform === 'android');
    const iosRecords = tokenRecords.filter((record) => record.platform === 'ios');
    const webRecords = tokenRecords.filter((record) => record.platform !== 'android' && record.platform !== 'ios');
    await Promise.all([
        sendToRecords(androidRecords, {
            data: dataPayload,
            android: {
                priority: 'high',
            },
        }),
        sendToRecords(iosRecords, {
            notification: { title, body },
            data: dataPayload,
            apns: {
                headers: {
                    'apns-priority': '10',
                },
                payload: {
                    aps: {
                        sound: 'default',
                        contentAvailable: true,
                    },
                },
            },
        }),
        sendToRecords(webRecords, {
            notification: { title, body },
            data: dataPayload,
            webpush: {
                headers: { Urgency: 'high' },
                fcmOptions: actionUrl.startsWith('http') ? { link: actionUrl } : undefined,
                notification: {
                    title,
                    body,
                    icon: '/enkamba-logo.png',
                    badge: '/favicon.png',
                    data: { actionUrl },
                    requireInteraction: isCallNotification,
                    vibrate: isCallNotification ? [300, 150, 300, 150, 300] : undefined,
                },
            },
        }),
    ]);
    if (cleanupTasks.length) {
        await Promise.all(cleanupTasks);
    }
    return null;
});
//# sourceMappingURL=pushNotifications.js.map