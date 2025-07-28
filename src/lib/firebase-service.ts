import { ref, set, get, remove, child, DataSnapshot, Database } from "firebase/database";
import type { GiftCode, Reward, EditCodeFormValues, User, BannedAccounts, DbKey } from "@/types";
import { db1, db2 } from "./firebase"; // Import the initialized database instances
import { getClassCharForPieceType } from "@/types/rewards";

const dbs: Record<DbKey, Database> = { db1, db2 };

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

  const processedRewards = newCodeData.listRewards.map((reward: Reward) => {
    if (reward.rewardType === 'ARTIFACT') {
      return {
        ...reward,
        monsterId: 0,
        artifactInfo: {
          ...reward.artifactInfo,
          ClassChar: getClassCharForPieceType(reward.artifactInfo.Artifact_PieceType),
        },
      };
    }
    if (reward.rewardType === 'MONSTER') {
        return {
            ...reward,
            artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" }
        }
    }
    return {
        ...reward,
        monsterId: 0,
        artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" }
    }
  });

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
 * Fetches all gift codes from the first database.
 * @returns A promise that resolves to an array of GiftCode objects.
 */
export async function getAllGiftCodes(): Promise<GiftCode[]> {
    const codesRef = ref(db1, 'RedeemCodes');
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
 * Deletes a gift code from both databases.
 * @param codeId The ID of the code to delete.
 */
export async function deleteGiftCode(codeId: string): Promise<void> {
    const codeRef1 = ref(db1, `RedeemCodes/${codeId}`);
    const codeRef2 = ref(db2, `RedeemCodes/${codeId}`);

    try {
        await Promise.all([
            remove(codeRef1),
            remove(codeRef2)
        ]);
    } catch (error) {
        console.error("Failed to delete from one or more databases:", error);
        throw new Error("An error occurred while deleting the code.");
    }
}

/**
 * Updates a gift code in both databases.
 * @param codeId The ID of the code to update.
 * @param updatedData The data to update.
 * @returns The updated gift code object.
 */
export async function updateGiftCode(codeId: string, updatedData: EditCodeFormValues): Promise<GiftCode> {
    const codeRef1 = ref(db1, `RedeemCodes/${codeId}`);
    const codeRef2 = ref(db2, `RedeemCodes/${codeId}`);

    // Fetch the existing code to merge data
    const snapshot = await get(codeRef1);
    if (!snapshot.exists()) {
        throw new Error(`Code "${codeId}" not found.`);
    }
    const existingCode = snapshot.val() as GiftCode;

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + updatedData.expireDays);

    const processedRewards = updatedData.listRewards.map((reward: Reward) => {
        if (reward.rewardType === 'ARTIFACT') {
          return {
            ...reward,
            monsterId: 0,
            artifactInfo: {
              ...reward.artifactInfo,
              ClassChar: getClassCharForPieceType(reward.artifactInfo.Artifact_PieceType),
            },
          };
        }
         if (reward.rewardType === 'MONSTER') {
            return {
                ...reward,
                artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" }
            }
        }
        return {
            ...reward,
            monsterId: 0,
            artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" }
        }
    });

    const dataToSave: Omit<GiftCode, 'id'> = {
        ...existingCode,
        code: codeId,
        listRewards: processedRewards,
        maxClaimCount: updatedData.maxClaimCount,
        currClaimCount: updatedData.currClaimCount,
        expire: expireDate.toISOString(),
    };

    try {
        await Promise.all([
            set(codeRef1, dataToSave),
            set(codeRef2, dataToSave)
        ]);
        return { ...dataToSave, id: codeId };
    } catch (error) {
        console.error("Failed to update one or more databases:", error);
        throw new Error("An error occurred while updating the code.");
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
