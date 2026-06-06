const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, limit, query, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "test-d4a67",
  appId: "1:918172597123:web:662724d40027374c4754b6",
  storageBucket: "test-d4a67.firebasestorage.app",
  apiKey: "AIzaSyDO32LGprSg9zUGdiQG85BCPg_2zsXnVdo",
  authDomain: "test-d4a67.firebaseapp.com",
  messagingSenderId: "918172597123",
  measurementId: "G-M76G1P8B77"
};

async function testFirebase() {
  console.log("Initializing Firebase App...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const testWord = "TestWord_" + Math.floor(Math.random() * 10000);
  console.log(`Attempting to write test word: "${testWord}" to 'words' collection...`);
  
  try {
    const docRef = await addDoc(collection(db, 'words'), {
      word: testWord,
      created_at: new Date()
    });
    console.log(`Successfully wrote document! ID: ${docRef.id}`);
    
    console.log("Fetching recent documents from 'words' collection...");
    const q = query(collection(db, 'words'), orderBy('created_at', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);
    
    let found = false;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- [${doc.id}]: ${data.word} (created_at: ${data.created_at?.toDate ? data.created_at.toDate() : data.created_at})`);
      if (data.word === testWord) {
        found = true;
      }
    });
    
    if (found) {
      console.log("Verification successful: The written word was found in the fetched list.");
    } else {
      console.warn("Verification warning: The written word was NOT found in the fetched list (might be due to replication lag or limit).");
    }
    
    console.log(`Cleaning up test document ${docRef.id}...`);
    await deleteDoc(doc(db, 'words', docRef.id));
    console.log("Cleanup complete!");
    console.log("Firebase connection test PASSED!");
  } catch (error) {
    console.error("Firebase connection test FAILED with error:", error);
    process.exit(1);
  }
}

testFirebase();
