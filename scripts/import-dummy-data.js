
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
// IMPORTANT: Make sure you have downloaded your Firebase service account key
// and named it 'serviceAccountKey.json' in this 'scripts' directory.
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const dummyDataPath = path.join(__dirname, 'dummy-data.json');
// ---------------------

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`ERROR: Service account key not found at ${serviceAccountPath}`);
  console.error("Please download your Firebase service account key, name it 'serviceAccountKey.json', and place it in the 'scripts' directory.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const dummyData = JSON.parse(fs.readFileSync(dummyDataPath, 'utf8'));

async function importData() {
  console.log('Starting data import...');

  for (const collectionData of dummyData) {
    const collectionName = collectionData.collection;
    const documents = collectionData.documents;

    console.log(`\nImporting to collection: ${collectionName}`);

    for (const doc of documents) {
      let dataToImport = { ...doc }; // Clone the document data

      // Process special __datatype__ fields (e.g., timestamps)
      for (const key in dataToImport) {
        if (dataToImport[key] && typeof dataToImport[key] === 'object' && dataToImport[key].__datatype__) {
          if (dataToImport[key].__datatype__ === 'timestamp') {
            dataToImport[key] = admin.firestore.Timestamp.fromDate(new Date(dataToImport[key].value));
          } else {
            console.warn(`Unknown __datatype__ "${dataToImport[key].__datatype__}" for field ${key}. Storing as is.`);
          }
        }
      }
      
      const docId = dataToImport.documentId || dataToImport.userId || dataToImport.faqId || dataToImport.updateId;
      
      // Remove any custom ID fields from the data object itself before writing
      delete dataToImport.documentId; 
      delete dataToImport.userId; // if used as ID
      delete dataToImport.faqId; // if used as ID
      delete dataToImport.updateId; // if used as ID

      try {
        if (docId) {
          await db.collection(collectionName).doc(docId).set(dataToImport);
          console.log(`  Document ${collectionName}/${docId} created/updated.`);
        } else {
          const newDocRef = await db.collection(collectionName).add(dataToImport);
          console.log(`  Document created in ${collectionName} with ID: ${newDocRef.id}`);
        }
      } catch (error) {
        console.error(`  Error importing document into ${collectionName} (ID: ${docId || 'auto-generated'}):`, error);
      }
    }
  }

  console.log('\nData import finished.');
}

importData().catch(error => {
  console.error('Unhandled error during import process:', error);
});

    