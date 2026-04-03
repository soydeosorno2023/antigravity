import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface SecurityLog {
  userId: string | null;
  operationType: string;
  path: string | null;
  errorMessage: string;
  timestamp: any;
}

export async function logSecurityEvent(
  operationType: string,
  path: string | null,
  errorMessage: string
) {
  try {
    const logsCollection = collection(db, 'security_logs');
    await addDoc(logsCollection, {
      userId: auth.currentUser?.uid || 'anonymous',
      operationType,
      path,
      errorMessage,
      timestamp: serverTimestamp(),
    });

    // Send email alert
    await fetch('/api/send-security-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: auth.currentUser?.uid || 'anonymous',
        operationType,
        path,
        errorMessage,
      }),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
