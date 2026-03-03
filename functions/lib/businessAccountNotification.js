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
exports.onBusinessAccountApproved = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Trigger: When business_requests document is updated
 * Action: Create notification for user when status changes to APPROVED
 */
exports.onBusinessAccountApproved = functions.firestore
    .document('business_requests/{requestId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Check if status changed to APPROVED
    if (before.status !== 'APPROVED' && after.status === 'APPROVED') {
        const userId = after.userId;
        const businessName = after.businessName;
        const businessType = after.type;
        try {
            // Create notification in user's notifications collection
            const notificationRef = db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .doc();
            await notificationRef.set({
                id: notificationRef.id,
                type: 'BUSINESS_APPROVED',
                title: 'Compte entreprise approuvé',
                message: `Félicitations! Votre compte entreprise "${businessName}" a été approuvé.`,
                businessName,
                businessType,
                businessId: context.params.requestId,
                icon: '🟢',
                actionUrl: '/dashboard/business-pro',
                actionLabel: 'Accéder à mon Espace Pro',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Notification created for user ${userId}`);
        }
        catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
    // Check if status changed to REJECTED
    if (before.status !== 'REJECTED' && after.status === 'REJECTED') {
        const userId = after.userId;
        const businessName = after.businessName;
        const rejectionReason = after.rejectionReason || 'Raison non spécifiée';
        try {
            // Create notification in user's notifications collection
            const notificationRef = db
                .collection('users')
                .doc(userId)
                .collection('notifications')
                .doc();
            await notificationRef.set({
                id: notificationRef.id,
                type: 'BUSINESS_REJECTED',
                title: 'Demande de compte entreprise rejetée',
                message: `Votre demande pour "${businessName}" a été rejetée. Motif: ${rejectionReason}`,
                businessName,
                rejectionReason,
                icon: '🔴',
                actionUrl: '/dashboard/settings/business-account',
                actionLabel: 'Modifier et renvoyer',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Rejection notification created for user ${userId}`);
        }
        catch (error) {
            console.error('Error creating rejection notification:', error);
            throw error;
        }
    }
});
//# sourceMappingURL=businessAccountNotification.js.map