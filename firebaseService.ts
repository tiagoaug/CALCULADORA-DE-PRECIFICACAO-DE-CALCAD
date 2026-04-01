
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
const getUserDataPath = (uid: string) => `users/${uid}`;

export const firebaseService = {
  // --- DATABASE OPERATIONS ---

  /**
   * Loads the entire database for a user
   */
  async loadFullDatabase(uid: string): Promise<AppDatabase | null> {
    try {
      const projectsSnap = await getDocs(collection(db, `${getUserDataPath(uid)}/projects`));
      const librarySnap = await getDoc(doc(db, `${getUserDataPath(uid)}/library/main`));
      const settingsSnap = await getDoc(doc(db, `${getUserDataPath(uid)}/settings/config`));
      const pricesSnap = await getDocs(collection(db, `${getUserDataPath(uid)}/prices`));
      const suppliersSnap = await getDocs(collection(db, `${getUserDataPath(uid)}/suppliers`));

      if (!librarySnap.exists() && projectsSnap.empty) return null;

      const products: ProductData[] = [];
      projectsSnap.forEach(doc => products.push(doc.data() as ProductData));

      const prices: MaterialPriceRecord[] = [];
      pricesSnap.forEach(doc => prices.push(doc.data() as MaterialPriceRecord));

      const suppliers: Supplier[] = [];
      suppliersSnap.forEach(doc => suppliers.push(doc.data() as Supplier));

      return {
        products,
        library: librarySnap.exists() ? librarySnap.data() as LibraryData : { insumos: [], terceirizados: [], custosFixos: [], custosIndiretos: [], impostos: [], comissoes: [], fretes: [] },
        settings: settingsSnap.exists() ? settingsSnap.data() as AppSettings : { productionDays: 22, dailyProduction: 0, currency: 'BRL', theme: 'light' },
        materialPrices: prices,
        suppliers: suppliers
      };
    } catch (error) {
      console.error("Error loading database:", error);
      throw error;
    }
  },

  /**
   * Syncs existing local data to Firebase (Migration)
   */
  async syncLocalToFirebase(uid: string, localDb: AppDatabase) {
    const batch = writeBatch(db);

    // Sync Projects
    localDb.products.forEach(p => {
      const ref = doc(db, `${getUserDataPath(uid)}/projects/${p.id}`);
      batch.set(ref, p);
    });

    // Sync Library
    const libRef = doc(db, `${getUserDataPath(uid)}/library/main`);
    batch.set(libRef, localDb.library);

    // Sync Settings
    const settingsRef = doc(db, `${getUserDataPath(uid)}/settings/config`);
    batch.set(settingsRef, localDb.settings);

    // Sync Prices
    if (localDb.materialPrices) {
      localDb.materialPrices.forEach(pr => {
        const ref = doc(db, `${getUserDataPath(uid)}/prices/${pr.id}`);
        batch.set(ref, pr);
      });
    }

    // Sync Suppliers
    if (localDb.suppliers) {
      localDb.suppliers.forEach(s => {
        const ref = doc(db, `${getUserDataPath(uid)}/suppliers/${s.id}`);
        batch.set(ref, s);
      });
    }

    await batch.commit();
  },

  // --- PROJECT OPERATIONS ---

  async saveProject(uid: string, project: ProductData) {
    await setDoc(doc(db, `${getUserDataPath(uid)}/projects/${project.id}`), project);
  },

  async deleteProject(uid: string, projectId: string) {
    await deleteDoc(doc(db, `${getUserDataPath(uid)}/projects/${projectId}`));
  },

  // --- LIBRARY & SETTINGS ---

  async updateLibrary(uid: string, library: LibraryData) {
    await setDoc(doc(db, `${getUserDataPath(uid)}/library/main`), library);
  },

  async updateSettings(uid: string, settings: AppSettings) {
    await setDoc(doc(db, `${getUserDataPath(uid)}/settings/config`), settings);
  },

  // --- PRICE HISTORY ---

  async addPriceRecord(uid: string, record: MaterialPriceRecord) {
    await setDoc(doc(db, `${getUserDataPath(uid)}/prices/${record.id}`), record);
  },

  async deletePriceRecord(uid: string, recordId: string) {
    await deleteDoc(doc(db, `${getUserDataPath(uid)}/prices/${recordId}`));
  },

  // --- SUPPLIERS ---

  async saveSupplier(uid: string, supplier: Supplier) {
    await setDoc(doc(db, `${getUserDataPath(uid)}/suppliers/${supplier.id}`), supplier);
  },

  async deleteSupplier(uid: string, supplierId: string) {
    await deleteDoc(doc(db, `${getUserDataPath(uid)}/suppliers/${supplierId}`));
  }
};
