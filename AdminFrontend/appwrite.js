import {
  Client,
  Databases,
  Account,
  ID,
  Functions,
  Avatars,
  Query,
  Storage,
} from "appwrite";

const client = new Client();
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // Replace with your Appwrite endpoint
  .setProject("6926c7df002fa7831d94"); // Replace with your Appwrite project ID

const databases = new Databases(client);
const account = new Account(client);
const avatars = new Avatars(client);
const functions = new Functions(client);
const storage = new Storage(client);

export const Config = {
  endpoint: "https://cloud.appwrite.io/v1",
  projectId: "6926c7df002fa7831d94",
  platform: "com.nilemart.ssd",
  databaseId: "6926c9bb00320db14571",
  userCollectionId: "6926d95b000583b78df2",
  reviewsCollectionId: "67f653d4000a1b786ee9",
  StorageId: "692a3b700039c02fb4bc",
  productCollectionId: "67f657eb0028d8159ff8",
  cartCollectionId: "67f744ee0038dee1ecf1",
  orderCollection: "67f65232002deafb7243",
  currenciesCollection: "67f6507e0022fa58ae07",
  addressCollection: "6692743ec001f0b2e851e",
  functionId: "67d25e700014c71138d1",
  transactionsId: "67f745eb00152657d543",
  orderCollectionId: "69274563002eee2bea49",
  updateOrderStatusFunctionId: "67e2551f002ec6477229",
  reportsCollectionId: "67ebd0f700080e92db27",
  NOTIFICATIONS_COLLECTION_ID: "69274552002816052be0",
  APPLICATIONS_COLLECTION_ID: "68c2fe530013904321cc",
  APPLICANT_CVS_BUCKET_ID: "68c2feda000396f76d7d",
};

export { databases, account, avatars, ID, functions, client, Query, storage };
