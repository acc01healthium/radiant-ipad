
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDoc,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CategoryType, Treatment } from '../types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSy...",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "liangli-aesthetics",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence and long polling for better compatibility in sandboxed environments
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  // experimentalForceLongPolling: true // Uncomment if still facing persistent "offline" errors in specific restricted networks
});

export const auth = getAuth(app);
export const storage = getStorage(app);

// Settings Helpers
export const getGeneralSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.warn("Firestore connectivity issue:", error);
  }
  return null;
};

export const updateGeneralSettings = async (data: any) => {
  const docRef = doc(db, 'settings', 'general');
  await setDoc(docRef, data, { merge: true });
};

// Seed Data Function
export const seedInitialData = async () => {
  const initialTreatments: Omit<Treatment, 'id'>[] = [
    {
      name: '皮秒雷射 (Picosure)',
      price: 8800,
      description: '全方位改善斑點、毛孔與膚色不均。利用極短脈衝產生光震波效應。',
      categories: [CategoryType.SPOTS, CategoryType.PORES],
      imageUrl: 'https://picsum.photos/seed/laser/400/300'
    },
    {
      name: '肉毒桿菌素 (Botox)',
      price: 4500,
      description: '放鬆動態皺紋（魚尾紋、抬頭紋），打造平滑肌膚。',
      categories: [CategoryType.WRINKLES],
      imageUrl: 'https://picsum.photos/seed/botox/400/300'
    },
    {
      name: '玻尿酸填充 (Hyaluronic Acid)',
      price: 15000,
      description: '填補凹陷部位（如淚溝、蘋果肌），恢復臉部澎潤感。',
      categories: [CategoryType.WRINKLES, CategoryType.SAGGING],
      imageUrl: 'https://picsum.photos/seed/filler/400/300'
    },
    {
      name: '海芙音波 (Ultraformer III)',
      price: 32000,
      description: '非侵入式深層拉提，改善臉部輪廓鬆弛與下顎線。',
      categories: [CategoryType.SAGGING],
      imageUrl: 'https://picsum.photos/seed/lifting/400/300'
    },
    {
      name: '淨膚雷射',
      price: 3000,
      description: '亮白肌膚，淡化泛紅與改善發炎性痘疤。',
      categories: [CategoryType.REDNESS, CategoryType.ACNE],
      imageUrl: 'https://picsum.photos/seed/whitening/400/300'
    }
  ];

  try {
    const treatmentsCol = collection(db, 'treatments');
    const snapshot = await getDocs(treatmentsCol);
    
    if (snapshot.empty) {
      console.log('Seeding initial data...');
      for (const t of initialTreatments) {
        await addDoc(treatmentsCol, t);
      }
      return true;
    }
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
  return false;
};

// Storage Helpers
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
