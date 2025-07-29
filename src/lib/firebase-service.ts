
import { ref, set, get, remove, child, DataSnapshot, Database } from "firebase/database";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, listAll, deleteObject, uploadString, getMetadata, type StorageReference, type FirebaseStorage } from "firebase/storage";
import type { GiftCode, Reward, EditCodeFormValues, User, BannedAccounts, DbKey, StoredFile } from "@/types";
import { db1, db2, storage1, storage2 } from "./firebase"; // Import the initialized instances
import { getClassCharForPieceType } from "@/types/rewards";

const dbs: Record<DbKey, Database> = { db1, db2 };
// For file manager, we will primarily use storage1 as the single source of truth.
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

const FILE_STORAGE_ROOT = 'FileStorage/';

/**
 * Uploads a file to a specific path in Firebase Storage.
 * @param file The file to upload.
 * @param path The path within the storage bucket to upload to.
 * @param onProgress A callback to report upload progress.
 * @returns A promise that resolves with the download URL.
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress: (progress: number) => void
): Promise<string> {
  // Combine the root, the current path, and the file name.
  // The `path` parameter (currentPath) already ends with a "/" if it's a folder,
  // or is an empty string if it's the root. This handles both cases.
  const fullPath = `${FILE_STORAGE_ROOT}${path}${file.name}`;
  const fileRef = storageRef(storage1, fullPath);
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
        reject(new Error(`File upload failed for ${file.name}.`));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

/**
 * Lists all files and folders in a given path.
 * @param path The path to list contents from.
 * @returns A promise that resolves to an array of StoredFile objects.
 */
export async function listFiles(path: string): Promise<StoredFile[]> {
  const listRef = storageRef(storage1, `${FILE_STORAGE_ROOT}${path}`);
  const res = await listAll(listRef);
  
  const folders = res.prefixes.map(async (folderRef) => {
    return {
      name: folderRef.name,
      path: folderRef.fullPath.replace(FILE_STORAGE_ROOT, ''),
      isFolder: true,
      size: 0,
      url: '',
      type: 'folder',
      created: new Date().toISOString(), // Folders don't have creation dates
    };
  });

  const files = res.items.map(async (itemRef) => {
    const metadata = await getMetadata(itemRef);
    const downloadURL = await getDownloadURL(itemRef);
    return {
      name: metadata.name,
      path: metadata.fullPath.replace(FILE_STORAGE_ROOT, ''),
      isFolder: false,
      url: downloadURL,
      size: metadata.size,
      type: metadata.contentType || 'unknown',
      created: metadata.timeCreated,
    };
  });

  return Promise.all([...folders, ...files]);
}


/**
 * Deletes a file or folder from Firebase Storage.
 * @param itemPath The full path of the item to delete.
 * @param isFolder Whether the item is a folder.
 */
export async function deleteItem(itemPath: string, isFolder: boolean): Promise<void> {
  const fullPath = `${FILE_STORAGE_ROOT}${itemPath}`;
  if (isFolder) {
    // To delete a "folder", we list all items and prefixes inside it and delete them recursively.
    const listRef = storageRef(storage1, fullPath);
    const res = await listAll(listRef);
    const deletePromises = res.items.map(item => deleteObject(item));
    await Promise.all(deletePromises);
     const deleteFolderPromises = res.prefixes.map(prefix => deleteItem(prefix.fullPath.replace(FILE_STORAGE_ROOT, ''), true));
    await Promise.all(deleteFolderPromises);
    // Delete the placeholder if it exists
    const placeholderRef = storageRef(storage1, `${fullPath}/.placeholder`);
    try {
        await deleteObject(placeholderRef);
    } catch(e) {
        // ignore if placeholder doesn't exist
    }

  } else {
    const fileRef = storageRef(storage1, fullPath);
    try {
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Delete failed:", error);
      throw new Error("Could not delete the file.");
    }
  }
}


/**
 * Creates a "folder" by uploading a placeholder file.
 * @param path The path where the folder should be created.
 * @param folderName The name of the new folder.
 */
export async function createFolder(path: string, folderName: string): Promise<void> {
    const folderPath = `${FILE_STORAGE_ROOT}${path}${folderName}/.placeholder`;
    const folderRef = storageRef(storage1, folderPath);
    try {
        await uploadString(folderRef, '');
    } catch (error) {
        console.error("Folder creation failed:", error);
        throw new Error("Could not create the folder.");
    }
}

    
