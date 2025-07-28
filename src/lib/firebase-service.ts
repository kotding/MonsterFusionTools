import type { Data } from "@/types";

// This is a mock database. In a real application, you would interact
// with Firebase Firestore or Realtime Database here.
let mockData: Data[] = [
  { id: '1', name: 'User Count', value: '1,250', timestamp: Date.now() - 100000 },
  { id: '2', name: 'Active Subscriptions', value: '342', timestamp: Date.now() - 200000 },
  { id: '3', name: 'Server Uptime', value: '99.98%', timestamp: Date.now() - 300000 },
  { id: '4', name: 'API Latency (avg)', value: '120ms', timestamp: Date.now() - 400000 },
  { id: '5', name: 'New Signups (24h)', value: '78', timestamp: Date.now() - 500000 },
  { id: '6', name: 'Error Rate', value: '0.12%', timestamp: Date.now() - 600000 },
];

// Simulate network delay to mimic real-world API calls
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Fetches all data entries.
 * Replace this with your actual Firebase `getDocs` or `onValue` call.
 */
export async function getData(): Promise<Data[]> {
  await wait(500);
  console.log("Mock Service: Fetching data");
  // Return a sorted copy of the data
  return [...mockData].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Adds a new data entry.
 * Replace this with your actual Firebase `addDoc` or `set` call.
 */
export async function addData(newItem: Omit<Data, 'id' | 'timestamp'>): Promise<Data> {
  await wait(300);
  const newEntry: Data = {
    ...newItem,
    id: (Math.random() + 1).toString(36).substring(7), // simple unique id
    timestamp: Date.now(),
  };
  mockData = [newEntry, ...mockData];
  console.log("Mock Service: Added data", newEntry);
  return newEntry;
}

/**
 * Updates an existing data entry.
 * Replace this with your actual Firebase `updateDoc` or `update` call.
 */
export async function updateData(id: string, updatedItem: Partial<Omit<Data, 'id' | 'timestamp'>>): Promise<Data> {
  await wait(300);
  let entryToUpdate: Data | undefined;
  mockData = mockData.map(item => {
    if (item.id === id) {
      entryToUpdate = { ...item, ...updatedItem, timestamp: Date.now() };
      return entryToUpdate;
    }
    return item;
  });
  if (!entryToUpdate) {
    throw new Error("Item not found");
  }
  console.log("Mock Service: Updated data", entryToUpdate);
  return entryToUpdate;
}

/**
 * Deletes a data entry.
 * Replace this with your actual Firebase `deleteDoc` or `remove` call.
 */
export async function deleteData(id: string): Promise<{ id: string }> {
  await wait(300);
  const initialLength = mockData.length;
  mockData = mockData.filter(item => item.id !== id);
  if (mockData.length === initialLength) {
    throw new Error("Item not found");
  }
  console.log("Mock Service: Deleted data with id", id);
  return { id };
}
