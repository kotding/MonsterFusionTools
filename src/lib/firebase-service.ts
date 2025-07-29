import { ref, set, get, remove, child, DataSnapshot, Database } from "firebase/database";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, listAll, deleteObject, type StorageReference, type FirebaseStorage } from "firebase/storage";
import type { GiftCode, Reward, EditCodeFormValues, User, BannedAccounts, DbKey, StoredFile } from "@/types";
import { db1, db2, storage1, storage2 } from "./firebase"; // Import the initialized instances
import { getClassCharForPieceType } from "@/types/rewards";

const dbs: Record<DbKey, Database> = { db1, db2 };
const storages: Record<DbKey, FirebaseStorage> = { db1: storage1, db2: storage2 };


function processRewards(rewards: Reward[]): any[] {
    return rewards.map((r: Reward) => {
        const reward: any = {
            rewardType: r.rewardType,
            rewardAmount: r.rewardAmount,
            monsterId: 0,
            iapKey: "",
            artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" }
        };

        if (r.rewardType === 'ARTIFACT' && r.artifactInfo) {
            reward.artifactInfo = {
                ...r.artifactInfo,
                ClassChar: getClassCharForPieceType(r.artifactInfo.Artifact_PieceType),
            };
        } else if (r.rewardType === 'MONSTER') {
            reward.monsterId = r.monsterId;
        } else if (r.rewardType === 'PURCHASE_PACK') {
            reward.iapKey = r.iapKey || "";
        }
        
        // Remove empty strings for cleaner data in Firebase
        if(reward.iapKey === "") {
            delete reward.iapKey;
        }

        return reward;
    });
}


/**
 * Adds a new gift code to both Firebase Realtime Databases under "RedeemCodes".
 * @param newCodeData - The data for the new gift code.
 * @returns The created gift code object.
 * @throws An error if the code already exists in the first database.
 */
export async function addGiftCode(newCodeData: Omit<GiftCode, 'id'>): Promise<GiftCode> {
  const codeRef1 = ref(db1, `RedeemCodes/${newCodeData.code}`);
  
  const snapshot = await get(codeRef1);
  if (snapshot.exists()) {
    throw new Error(`Code "${newCodeData.code}" already exists.`);
  }

  const processedRewards = processRewards(newCodeData.listRewards);

  const newEntry: GiftCode = {
    ...newCodeData,
    id: newCodeData.code,
    listRewards: processedRewards,
  };
  
  const dataToSave: Omit<GiftCode, 'id'> = { 
      code: newCodeData.code,
      currClaimCount: newCodeData.currClaimCount,
      day: newCodeData.day,
      expire: newCodeData.expire,
      listRewards: processedRewards,
      maxClaimCount: newCodeData.maxClaimCount,
  };

  const codeRef2 = ref(db2, `RedeemCodes/${newCodeData.code}`);
  
  try {
    await Promise.all([
      set(codeRef1, dataToSave),
      set(codeRef2, dataToSave)
    ]);
    
    return newEntry;
  } catch (error) {
    console.error("Failed to write to one or more databases:", error);
    throw new Error("An error occurred while saving the code to the databases.");
  }
}

/**
 * Fetches all gift codes from the specified database.
 * @param dbKey The key of the database to fetch from ('db1' or 'db2').
 * @returns A promise that resolves to an array of GiftCode objects.
 */
export async function getAllGiftCodes(dbKey: DbKey): Promise<GiftCode[]> {
    const selectedDb = dbs[dbKey];
    const codesRef = ref(selectedDb, 'RedeemCodes');
    const snapshot = await get(codesRef);
    if (snapshot.exists()) {
        const codesData = snapshot.val();
        // Convert the object of codes into an array and add the id
        return Object.keys(codesData).map(key => ({
            id: key,
            ...codesData[key]
        }));
    }
    return [];
}

/**
 * Deletes a gift code from the specified database.
 * @param codeId The ID of the code to delete.
 * @param dbKey The key of the database to update.
 */
export async function deleteGiftCode(codeId: string, dbKey: DbKey): Promise<void> {
    const selectedDb = dbs[dbKey];
    const codeRef = ref(selectedDb, `RedeemCodes/${codeId}`);
    try {
        await remove(codeRef);
    } catch (error) {
        console.error(`Failed to delete from ${dbKey}:`, error);
        throw new Error(`An error occurred while deleting the code from ${dbKey}.`);
    }
}

/**
 * Updates a gift code in the specified database.
 * @param codeId The ID of the code to update.
 * @param updatedData The data to update.
 * @param dbKey The key of the database to update.
 * @returns The updated gift code object.
 */
export async function updateGiftCode(codeId: string, updatedData: EditCodeFormValues, dbKey: DbKey): Promise<GiftCode> {
    const selectedDb = dbs[dbKey];
    const codeRef = ref(selectedDb, `RedeemCodes/${codeId}`);

    // Fetch the existing code to merge data
    const snapshot = await get(codeRef);
    if (!snapshot.exists()) {
        throw new Error(`Code "${codeId}" not found in ${dbKey}.`);
    }
    const existingCode = snapshot.val() as GiftCode;

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + updatedData.expireDays);

    const processedRewards = processRewards(updatedData.listRewards);

    const dataToSave: Omit<GiftCode, 'id'> = {
        ...existingCode,
        code: codeId,
        listRewards: processedRewards,
        maxClaimCount: updatedData.maxClaimCount,
        currClaimCount: updatedData.currClaimCount,
        expire: expireDate.toISOString(),
    };

    try {
        await set(codeRef, dataToSave);
        return { ...dataToSave, id: codeId };
    } catch (error) {
        console.error(`Failed to update ${dbKey}:`, error);
        throw new Error(`An error occurred while updating the code in ${dbKey}.`);
    }
}

// --- User Management ---

/**
 * Fetches all users from the specified database.
 * @param dbKey The key of the database to fetch from ('db1' or 'db2').
 * @returns A promise that resolves to an array of User objects.
 */
export async function getAllUsers(dbKey: DbKey): Promise<User[]> {
    const selectedDb = dbs[dbKey];
    const usersRef = ref(selectedDb, 'Users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
        const usersData = snapshot.val();
        return Object.keys(usersData).map(key => ({
            id: key,
            ...usersData[key]
        }));
    }
    return [];
}

/**
 * Fetches the list of banned user UIDs from the specified database.
 * @param dbKey The key of the database to fetch from ('db1' or 'db2').
 * @returns A promise that resolves to a BannedAccounts object.
 */
export async function getBannedAccounts(dbKey: DbKey): Promise<BannedAccounts> {
    const selectedDb = dbs[dbKey];
    const bannedRef = ref(selectedDb, 'BannedAccounts');
    const snapshot = await get(bannedRef);
    return snapshot.exists() ? snapshot.val() : {};
}

/**
 * Bans a user by adding their UID to the BannedAccounts list in the specified database.
 * @param uid The UID of the user to ban.
 * @param dbKey The key of the database to update ('db1' or 'db2').
 */
export async function banUser(uid: string, dbKey: DbKey): Promise<void> {
    const selectedDb = dbs[dbKey];
    const banRef = ref(selectedDb, `BannedAccounts/${uid}`);
    try {
        await set(banRef, "Banned");
    } catch (error) {
        console.error(`Failed to ban user in ${dbKey}:`, error);
        throw new Error(`An error occurred while banning the user in ${dbKey}.`);
    }
}

/**
 * Unbans a user by removing their UID from the BannedAccounts list in the specified database.
 * @param uid The UID of the user to unban.
 * @param dbKey The key of the database to update ('db1' or 'db2').
 */
export async function unbanUser(uid: string, dbKey: DbKey): Promise<void> {
    const selectedDb = dbs[dbKey];
    const banRef = ref(selectedDb, `BannedAccounts/${uid}`);
    try {
        await remove(banRef);
    } catch (error) {
        console.error(`Failed to unban user in ${dbKey}:`, error);
        throw new Error(`An error occurred while unbanning the user in ${dbKey}.`);
    }
}

// --- File Storage ---

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param dbKey The key of the storage to use.
 * @param onProgress A callback to report upload progress.
 * @returns A promise that resolves with the download URL.
 */
export async function uploadFile(
  file: File,
  dbKey: DbKey,
  onProgress: (progress: number) => void
): Promise<string> {
  const selectedStorage = storages[dbKey];
  const fileRef = storageRef(selectedStorage, `uploads/${file.name}`);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        reject(new Error("File upload failed."));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

/**
 * Lists all files in the uploads directory.
 * @param dbKey The key of the storage to use.
 * @returns A promise that resolves to an array of StoredFile objects.
 */
export async function listFiles(dbKey: DbKey): Promise<StoredFile[]> {
  const selectedStorage = storages[dbKey];
  const listRef = storageRef(selectedStorage, 'uploads');
  const res = await listAll(listRef);
  
  const files = await Promise.all(
    res.items.map(async (itemRef) => {
      const downloadURL = await getDownloadURL(itemRef);
      const metadata = await itemRef.getMetadata();
      return {
        name: metadata.name,
        url: downloadURL,
        size: metadata.size,
        type: metadata.contentType || 'unknown',
        created: metadata.timeCreated,
      };
    })
  );
  return files;
}

/**
 * Deletes a file from Firebase Storage.
 * @param fileName The name of the file to delete.
 * @param dbKey The key of the storage to use.
 */
export async function deleteFile(fileName: string, dbKey: DbKey): Promise<void> {
  const selectedStorage = storages[dbKey];
  const fileRef = storageRef(selectedStorage, `uploads/${fileName}`);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Delete failed:", error);
    throw new Error("Could not delete the file.");
  }
}
