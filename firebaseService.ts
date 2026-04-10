
import { 
  db 
} from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { 
  AppDatabase, 
  ProductData, 
  LibraryData, 
  AppSettings, 
  MaterialPriceRecord, 
  Supplier 
} from './types';

// Helper to get user data path
// Helper to get user data path
const getUserDataPath = (uid: string) => `users/${uid}`;

const sanitizeForFirestore = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (typeof data === 'number') {
    if (isNaN(data) || !isFinite(data)) return 0;
    return data;
  }
  if (Array.isArray(data)) return data.map(sanitizeForFirestore);
  if (typeof data === 'object') {
    // Handle Firestore instances if they ever appear (not expected here)
    if (data.id && data.path && typeof data.withConverter === 'function') return data;
    
    const sanitized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeForFirestore(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

export const firebaseService = {
  // --- DATABASE OPERATIONS ---

  /**
   * Loads the entire database for a user
   */
  async loadFullDatabase(uid: string): Promise<AppDatabase | null> {
    try {
      console.log(`Firebase: Loading database for UID: ${uid}`);
      const projectsSnap = await getDocs(collection(db, `${getUserDataPath(uid)}/projects`));
      const librarySnap = await getDoc(doc(db, `${getUserDataPath(uid)}/library/main`));
      const settingsSnap = await getDoc(doc(db, `${getUserDataPath(uid)}/settings/config`));
      const pricesSnap = await getDocs(collection(db, `${getUserDataPath(uid)}/prices`));
      const suppliersSnap = await getDocs(collection(db, `${getUserDataPath(uid)}/suppliers`));

      if (!librarySnap.exists() && projectsSnap.empty) {
        console.log("Firebase: No existing cloud data found.");
        return null;
      }

      const products: ProductData[] = [];
      projectsSnap.forEach(doc => products.push({ ...(doc.data() as ProductData), id: doc.id }));

      const prices: MaterialPriceRecord[] = [];
      pricesSnap.forEach(doc => prices.push({ ...(doc.data() as MaterialPriceRecord), id: doc.id }));

      const suppliers: Supplier[] = [];
      suppliersSnap.forEach(doc => suppliers.push({ ...(doc.data() as Supplier), id: doc.id }));

      console.log(`Firebase: Loaded ${products.length} projects, ${prices.length} prices, ${suppliers.length} suppliers.`);

      return {
        products,
        library: librarySnap.exists() ? librarySnap.data() as LibraryData : { 
          insumos: [], 
          pecas: [], 
          terceirizados: [], 
          custosFixos: [], 
          custosIndiretos: [], 
          impostos: [], 
          comissoes: [], 
          fretes: [],
          solados: [],
          unidadesMedida: []
        },
        settings: settingsSnap.exists() ? settingsSnap.data() as AppSettings : { productionDays: 22, dailyProduction: 0, currency: 'BRL', theme: 'light' },
        materialPrices: prices,
        suppliers: suppliers,
        uid: uid // Pin the loaded state to this specific UID
      };
    } catch (error) {
      console.error("Firebase: Error loading database:", error);
      throw error;
    }
  },

  /**
   * Syncs existing local data to Firebase (Migration with Orphan Deletion)
   */
  async syncLocalToFirebase(uid: string, localDb: AppDatabase) {
    const path = getUserDataPath(uid);
    const collections = ['projects', 'prices', 'suppliers'];
    
    console.log(`Firebase: Initiating sync for user ${uid}`);
    
    // We'll use a dynamic process to safely handle more than 500 operations
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    const commitIfNeeded = async () => {
      operationCount++;
      if (operationCount >= 450) {
        console.log(`Firebase: Committing intermediate batch (${operationCount} operations)...`);
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    };

    // 1. Sync Collections with Orphan Deletion
    for (const col of collections) {
      const snap = await getDocs(collection(db, `${path}/${col}`));
      const remoteIds = snap.docs.map(d => d.id);
      
      let localItems: any[] = [];
      if (col === 'projects') localItems = localDb.products;
      else if (col === 'prices') localItems = localDb.materialPrices || [];
      else if (col === 'suppliers') localItems = localDb.suppliers || [];

      const sanitizedItems = localItems.map(item => sanitizeForFirestore(item));
      const localIds = sanitizedItems.map(item => item.id);

      console.log(`Firebase: Syncing ${col}. Remote: ${remoteIds.length}, Local: ${localIds.length}`);

      // Delete Orphans
      for (const rid of remoteIds) {
        if (!localIds.includes(rid)) {
          currentBatch.delete(doc(db, `${path}/${col}/${rid}`));
          await commitIfNeeded();
        }
      }

      // Set/Update Local
      for (const item of sanitizedItems) {
        currentBatch.set(doc(db, `${path}/${col}/${item.id}`), item);
        await commitIfNeeded();
      }
    }

    // 2. Sync Library (Single Document)
    console.log("Firebase: Syncing library document...");
    const sanitizedLibrary = sanitizeForFirestore(localDb.library || {});
    const libRef = doc(db, `${path}/library/main`);
    currentBatch.set(libRef, sanitizedLibrary);
    await commitIfNeeded();

    // 3. Sync Settings (Single Document)
    console.log("Firebase: Syncing settings document...");
    const sanitizedSettings = sanitizeForFirestore(localDb.settings || {});
    const settingsRef = doc(db, `${path}/settings/config`);
    currentBatch.set(settingsRef, sanitizedSettings);
    await commitIfNeeded();

    // FINAL COMMIT
    if (operationCount > 0) {
      console.log(`Firebase: Finalizing sync (${operationCount} operations)...`);
      await currentBatch.commit();
    }
    console.log("Firebase: Full sync completed successfully.");
  },


  // --- PROJECT OPERATIONS ---

  async saveProject(uid: string, project: ProductData) {
    const sanitized = sanitizeForFirestore(project);
    await setDoc(doc(db, `${getUserDataPath(uid)}/projects/${project.id}`), sanitized);
  },

  async deleteProject(uid: string, projectId: string) {
    await deleteDoc(doc(db, `${getUserDataPath(uid)}/projects/${projectId}`));
  },

  // --- LIBRARY & SETTINGS ---

  async updateLibrary(uid: string, library: LibraryData) {
    const sanitized = sanitizeForFirestore(library);
    await setDoc(doc(db, `${getUserDataPath(uid)}/library/main`), sanitized);
  },

  async updateSettings(uid: string, settings: AppSettings) {
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(doc(db, `${getUserDataPath(uid)}/settings/config`), sanitized);
  },

  // --- PRICE HISTORY ---

  async addPriceRecord(uid: string, record: MaterialPriceRecord) {
    const sanitized = sanitizeForFirestore(record);
    await setDoc(doc(db, `${getUserDataPath(uid)}/prices/${record.id}`), sanitized);
  },

  async deletePriceRecord(uid: string, recordId: string) {
    await deleteDoc(doc(db, `${getUserDataPath(uid)}/prices/${recordId}`));
  },

  // --- SUPPLIERS ---

  async saveSupplier(uid: string, supplier: Supplier) {
    const sanitized = sanitizeForFirestore(supplier);
    await setDoc(doc(db, `${getUserDataPath(uid)}/suppliers/${supplier.id}`), sanitized);
  },

  async deleteSupplier(uid: string, supplierId: string) {
    await deleteDoc(doc(db, `${getUserDataPath(uid)}/suppliers/${supplierId}`));
  },

  /**
   * Wipes all user data from Firestore for a fresh start (Handles batch limits)
   */
  async clearFullDatabase(uid: string) {
    const path = getUserDataPath(uid);
    const collections = ['projects', 'prices', 'suppliers'];
    const docs = ['library/main', 'settings/config'];

    let batch = writeBatch(db);
    let count = 0;

    // 1. Delete Documents
    for (const d of docs) {
      batch.delete(doc(db, `${path}/${d}`));
      count++;
    }

    // 2. Delete Collections in bulk
    for (const col of collections) {
      const snap = await getDocs(collection(db, `${path}/${col}`));
      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        if (count >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  }
};
