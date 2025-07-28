import { ref, set, get } from "firebase/database";
import type { GiftCode, Reward } from "@/types";
import { db1, db2 } from "./firebase"; // Import the initialized database instances
import { getClassCharForPieceType } from "@/types/rewards";

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

  // Automatically set ClassChar for artifact rewards and reset unused fields
  const processedRewards = newCodeData.listRewards.map((reward: Reward) => {
    if (reward.rewardType === 'ARTIFACT') {
      return {
        ...reward,
        monsterId: 0, // Reset monsterId for ARTIFACT
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
    // For other types, reset both monsterId and artifactInfo
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
  
  // Data to be saved (without the id field, as it's the key)
  // Use a type assertion to match the expected structure in Firebase
  const dataToSave: Omit<GiftCode, 'id'> = { 
      code: newCodeData.code,
      currClaimCount: newCodeData.currClaimCount,
      day: newCodeData.day,
      expire: newCodeData.expire,
      listRewards: processedRewards,
      maxClaimCount: newCodeData.maxClaimCount,
  };

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
