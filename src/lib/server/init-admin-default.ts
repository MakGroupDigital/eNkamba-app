import 'server-only';
import { getAdminFirestore } from '@/lib/firebase-admin';

// Doit être importé AVANT les modules de functions/src : certains appellent admin.initializeApp()/admin.firestore()
// à l'import ; l'app par défaut doit alors déjà exister avec le compte de service.
getAdminFirestore();
