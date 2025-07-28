import { ref, set, get } from "firebase/database";
import type { GiftCode } from "@/types";
import { db1, db2 } from "./firebase"; // Import the initialized database instances

/**
 * Adds a new gift code to both Firebase Realtime Databases under "RedeemCodes".
 * @param newCodeData - The data for the new gift code.
 * @returns The created gift code object.
 * @throws An error if the code already exists in the first database.
 */
export async function addGiftCode(newCodeData: Omit<GiftCode, 'id'>): Promise<GiftCode> {
  const codeRef1 = ref(db1, `RedeemCodes/${newCodeData.code}`);
  
  // 1. Check if the code already exists in the first database
  const snapshot = await get(codeRef1);
  if (snapshot.exists()) {
    throw new Error(`Code "${newCodeData.code}" already exists.`);
  }

  const newEntry: GiftCode = {
    ...newCodeData,
    id: newCodeData.code,
  };
  
  // Data to be saved (without the id field, as it's the key)
  const dataToSave: Omit<GiftCode, 'id'> = { ...newCodeData };

  // 2. Write the new code to both databases simultaneously
  const codeRef2 = ref(db2, `RedeemCodes/${newCodeData.code}`);
  
  try {
    await Promise.all([
      set(codeRef1, dataToSave),
      set(codeRef2, dataToSave)
    ]);
    
    console.log("Service: Successfully added gift code to both databases", newEntry);
    return newEntry;
  } catch (error) {
    console.error("Failed to write to one or more databases:", error);
    // You might want to add rollback logic here if one write fails
    throw new Error("An error occurred while saving the code to the databases.");
  }
}
