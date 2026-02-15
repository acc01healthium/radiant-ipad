import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const storage = getStorage(app);

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

export const seedInitialData = async () => {
  const settingsRef = doc(db, 'settings', 'general');
  const settingsSnap = await getDoc(settingsRef);
  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
      clinicName: '亮立美學',
      clinicNameEn: 'Radiant Clinic'
    });
  }

  const initialTreatments: Omit<Treatment, 'id'>[] = [
    {
      name: '探索皮秒雷射 (Discovery Pico)',
      price: 8800,
      description: '全方位改善斑點、毛孔與膚色不均。利用極短脈衝產生光震波效應。',
      categories: [CategoryType.SPOTS, CategoryType.PORES],
      imageUrl: 'https://picsum.photos/seed/pico/400/300'
    },
    {
      name: '肉毒桿菌素 (Botox/Dysport)',
      price: 4500,
      description: '針對皺紋部位進行放鬆，改善動態紋路如抬頭紋、魚尾紋。',
      categories: [CategoryType.WRINKLES],
      imageUrl: 'https://picsum.photos/seed/botox/400/300'
    },
    {
      name: '海芙音波拉提 (Ultraformer)',
      price: 32000,
      description: '非侵入式深層拉提，改善臉部輪廓鬆弛與下顎線條。',
      categories: [CategoryType.LIFTING],
      imageUrl: 'https://picsum.photos/seed/lifting/400/300'
    },
    {
      name: '玻尿酸填補 (Restylane/Juvederm)',
      price: 15000,
      description: '針對凹陷部位如淚溝、蘋果肌、法令紋進行微整填補。',
      categories: [CategoryType.FILLERS],
      imageUrl: 'https://picsum.photos/seed/fillers/400/300'
    },
    {
      name: '真空除毛雷射',
      price: 2000,
      description: '舒適、快速、低痛感的專業除毛療程。',
      categories: [CategoryType.HAIR_REMOVAL],
      imageUrl: 'https://picsum.photos/seed/hair/400/300'
    }
  ];

  try {
    const treatmentsCol = collection(db, 'treatments');
    const snapshot = await getDocs(treatmentsCol);
    if (snapshot.empty) {
      for (const t of initialTreatments) {
        await addDoc(treatmentsCol, t);
      }
      return true;
    }
  } catch (error) {
    console.error("Error seeding:", error);
    throw error;
  }
  return false;
};

export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};