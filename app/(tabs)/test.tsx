import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/firebaseConfig.js"; // Ensure you import your Firebase config

const storage = getStorage(app);

export default async function testFirebaseStorage() {
  const storageRef = ref(storage, "test/testFile.txt"); // Reference to a test file

  // Create a Blob to upload
  const blob = new Blob(["Hello, world!"], { type: "text/plain" });

  try {
    // Attempt to upload
    await uploadBytes(storageRef, blob);
    console.log("Upload successful!");

    // Try to get the download URL
    const url = await getDownloadURL(storageRef);
    console.log("File available at:", url);
  } catch (error) {
    console.error("Error accessing Firebase Storage:", error);
  }
}


