import type { GiftCode } from "@/types";

// This is a mock database. In a real application, you would interact
// with Firebase Firestore or Realtime Database here.
const mockDatabase: { RedeemCodes: Record<string, Omit<GiftCode, 'id'>> } = {
    RedeemCodes: {}
};


// Simulate network delay to mimic real-world API calls
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Fetches all data entries.
 * Replace this with your actual Firebase `getDocs` or `onValue` call.
 */
// This function is not used in the gift code creator but is kept for reference
// export async function getData(): Promise<Data[]> {
//   await wait(500);
//   console.log("Mock Service: Fetching data");
//   return [];
// }


/**
 * Adds a new gift code to the mock database under "RedeemCodes".
 * In a real Firebase implementation, the `code` would be the key/document ID.
 * @param newCodeData - The data for the new gift code.
 * @returns The created gift code object.
 */
export async function addGiftCode(newCodeData: Omit<GiftCode, 'id'>): Promise<GiftCode> {
  await wait(100);
  
  if (mockDatabase.RedeemCodes[newCodeData.code]) {
    throw new Error(`Code "${newCodeData.code}" already exists.`);
  }

  const newEntry: GiftCode = {
    ...newCodeData,
    id: newCodeData.code,
  };
  
  // In Firebase Realtime DB, you would do something like:
  // const db = getDatabase();
  // await set(ref(db, 'RedeemCodes/' + newEntry.code), newCodeData);
  mockDatabase.RedeemCodes[newEntry.code] = newCodeData;
  
  console.log("Mock Service: Added gift code to RedeemCodes", newEntry);
  console.log("Current DB state:", mockDatabase);

  return newEntry;
}
