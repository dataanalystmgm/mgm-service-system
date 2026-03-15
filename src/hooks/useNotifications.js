// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useNotifications(userId, role) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Query mencari request yang statusnya berubah dan melibatkan user tsb
    const q = query(
      collection(db, "requests"),
      where(role === 'PIC' ? 'picId' : 'userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docChanges();
      changes.forEach((change) => {
        if (change.type === "modified") {
          console.log("Status berubah menjadi: ", change.doc.data().status);
          // Di sini Anda bisa memicu sound alert atau toast notification
        }
      });
    });

    return () => unsubscribe();
  }, [userId, role]);

  return notifications;
}