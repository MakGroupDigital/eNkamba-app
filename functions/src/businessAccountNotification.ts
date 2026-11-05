import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Trigger: When business_requests document is updated
 * Action: Create notification for user when a request becomes usable.
 */
export const onBusinessAccountApproved = functions.firestore
  .document('business_requests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    const usableStatuses = ['APPROVED', 'VERIFIED'];
    if (!usableStatuses.includes(before.status) && usableStatuses.includes(after.status)) {
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
          actionUrl: `/dashboard/business-pro?module=${encodeURIComponent(businessType || '')}&businessId=${encodeURIComponent(context.params.requestId)}`,
          actionLabel: 'Accéder à mon Espace Pro',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Notification created for user ${userId}`);
      } catch (error) {
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
          actionUrl: `/dashboard/settings/business-account?businessId=${encodeURIComponent(context.params.requestId)}`,
          actionLabel: 'Modifier et renvoyer',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Rejection notification created for user ${userId}`);
      } catch (error) {
        console.error('Error creating rejection notification:', error);
        throw error;
      }
    }
  });
