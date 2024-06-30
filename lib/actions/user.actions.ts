'use server';
import { cookies } from "next/headers";
import { createAdminClient, createSessionClient } from "../appwrite";
import { ID, Query } from "node-appwrite";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const  {
  APPWRITE_DATABASE_ID:DATABASE_ID,
  APPWRITE_BANK_COLLECTION_ID:BANK_COLLECTION_ID,
  APPWRITE_USER_COLLECTION_ID:USER_COLLECTION_ID,
} = process.env;

export const getUserInfo = async({userId}:getUserInfoProps)=>{
  try {
    const { database } = await createAdminClient();
    console.log("in getuserinfo got database")
    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )
    console.log("created user")
    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log(error)
    throw error;
  }
}

export const signIn = async({email,password}:signInProps)=>{
    try{
        const { account } = await createAdminClient();
        const session = await account.createEmailPasswordSession(email, password);
    
     cookies().set("appwrite-session", session.secret, {
       path: "/",
       httpOnly: true,
       sameSite: "strict",
       secure: true,
     });
        const user = await getUserInfo({userId:session.userId})
        return parseStringify(user);
    }catch(error){
          console.error('Error',error);
    }
}
export const signUp = async({password,...userData}:SignUpParams)=>{
     let newUserAccount;
    try{
     //Create a user account
   console.log(userData);
     const { account,database } = await createAdminClient();

      newUserAccount=await account.create(
        ID.unique(),
         userData.email,
         password,
        `${userData.firstName} ${userData.lastName}`,
    );
    if(!newUserAccount) throw new Error('Error creating user')
      const dwollaCustomerUrl = await createDwollaCustomer({
    ...userData,
    type:'personal',

    })
    if(!dwollaCustomerUrl) throw new Error('Error creating dwolla customer');
    const dwollaCustomerId= extractCustomerIdFromUrl(dwollaCustomerUrl)
    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
          ...userData,
          userId:newUserAccount.$id,
          dwollaCustomerId,
          dwollaCustomerUrl
      }
    )
     const session = await account.createEmailPasswordSession(userData.email, password);
    
     cookies().set("appwrite-session", session.secret, {
       path: "/",
       httpOnly: true,
       sameSite: "strict",
       secure: true,
     });
   return parseStringify(newUser);
    }catch(error){
      // console.log(userData)
      // console.log("meiserror");
          console.error('Error',error);
    }
}
// ... your initilization functions

export async function getLoggedInUser() {
    try {
      const { account } = await createSessionClient();
      const result =  await account.get();
      const user = await getUserInfo({userId:result.$id})
      return parseStringify(user);
    } catch (error) {
      return null;
    }
  }
  
  export const logoutAccount = async() =>{
    try{
    const {account} = await createSessionClient();
     cookies().delete('appwrite-session');
     await account.deleteSession('current');
    }catch(error){
         return null;
    }
  }
  export const createBankAccount = async({          
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    shareableId,
  }:createBankAccountProps) => {
    try{
      const {database} = await createAdminClient();
      const bankAccount = database.createDocument(
         DATABASE_ID!,
         BANK_COLLECTION_ID!,
        ID.unique(),
        {
          userId,
          bankId,
          accountId,
          accessToken,
          fundingSourceUrl,
          shareableId,
    })
    return parseStringify(bankAccount);
    }catch(error){
      console.log(error);
    }
  }
  export const createLinkToken = async(user:User) =>{
     try{
       const tokenParams = {
        user:{
          client_user_id:user.$id
        },
        client_name:`${user.firstName} ${user.lastName}`,
        products:['auth'] as Products[],
        language:'en',
        country_codes:['US'] as CountryCode[], 
        client_id: process.env.PLAID_CLIENT_ID,  // Direct assignment
        secret: process.env.PLAID_SECRET,   
       }
       console.log('Creating link token with parameters:', tokenParams);
       const response = await plaidClient.linkTokenCreate(tokenParams);
       console.log('Link token created successfully:', response.data.link_token);
       return parseStringify({linkToken:response.data.link_token});
     }catch(error){
      console.log('An error occurred while creating link token:', error);
      throw error;
     }
  }
  export const exchangePublicToken = async({publicToken,user}:exchangePublicTokenProps)=>{
    try{
      console.log('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID);
      console.log('PLAID_SECRET:', process.env.PLAID_SECRET);
        // Exchange public token for access token
    console.log('Exchanging public token...');
          const response = await plaidClient.itemPublicTokenExchange({
            public_token:publicToken,
            client_id: process.env.PLAID_CLIENT_ID,  // Direct assignment
        secret: process.env.PLAID_SECRET,   
          });
          console.log('Public token exchanged successfully.');
          const accessToken = response.data.access_token;
          const itemId = response.data.item_id;
          console.log('Access Token:', accessToken);
    console.log('Item ID:', itemId);
    // Get account data
    console.log('Fetching account data...');
          const accountResponse = await plaidClient.accountsGet({
            access_token:accessToken,
            client_id: process.env.PLAID_CLIENT_ID,  // Direct assignment
        secret: process.env.PLAID_SECRET,   
          });
          const accountData= accountResponse.data.accounts[0];
          console.log('Account Data:', accountData);
          // Create processor token
    console.log('Creating processor token...');
          const request : ProcessorTokenCreateRequest = {
                   access_token:accessToken,
                   account_id:accountData.account_id,
                   processor:"dwolla" as ProcessorTokenCreateRequestProcessorEnum,
                   client_id: process.env.PLAID_CLIENT_ID,  // Direct assignment
        secret: process.env.PLAID_SECRET,   
          };
          const ProcessorTokenResponse = await plaidClient.processorTokenCreate(request);
          console.log('Processor token created successfully.');
          const processorToken = ProcessorTokenResponse.data.processor_token;
          console.log('Processor Token:', processorToken);
           // Add funding source
    console.log('Adding funding source...');
          const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId:user.dwollaCustomerId,
            processorToken,
            bankName:accountData.name,
          });

          if(!fundingSourceUrl) {
            console.log("meerror");
            throw Error;
          }
          console.log('Funding source added successfully.');

    // Create bank account
    console.log('Creating bank account...');

          await createBankAccount({
            userId:user.$id,
            bankId:itemId,
            accountId:accountData.account_id,
            accessToken,
            fundingSourceUrl,
            shareableId:encryptId(accountData.account_id),
          });
          console.log('Bank account created successfully.');

    // Revalidate path
    console.log('Revalidating path...');
          revalidatePath("/");
          console.log('Path revalidated successfully.');
          return parseStringify({
            publicTokenExchange:"complete"
          });
    }
    catch(error){
      console.log('An error occurred while creating token:', error);
      throw error;
    }
  }



  export const getBanks = async ({ userId }: getBanksProps) => {
    try {
      const { database } = await createAdminClient();
  
      const banks = await database.listDocuments(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        [Query.equal('userId', [userId])]
      )
  
      return parseStringify(banks.documents);
    } catch (error) {
      console.log(error)
    }
  }
  
  export const getBank = async ({ documentId }: getBankProps) => {
    try {
      const { database } = await createAdminClient();
  
      const bank = await database.listDocuments(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        [Query.equal('$id', [documentId])]
      )
  
      return parseStringify(bank.documents[0]);
    } catch (error) {
      console.log(error)
    }
  }
  
  export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
    try {
      const { database } = await createAdminClient();
  
      const bank = await database.listDocuments(
        DATABASE_ID!,
        BANK_COLLECTION_ID!,
        [Query.equal('accountId', [accountId])]
      )
  
      if(bank.total !== 1) return null;
  
      return parseStringify(bank.documents[0]);
    } catch (error) {
      console.log(error)
    }
  }