'use server';
import { cookies } from "next/headers";
import { createAdminClient, createSessionClient } from "../appwrite";
import { ID } from "node-appwrite";
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
export const signIn = async({email,password}:signInProps)=>{
    try{
        const { account } = await createAdminClient();
        const response = await account.createEmailPasswordSession(email,password);
        return parseStringify(response);
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
      const user =  await account.get();
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
    sharableId
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
          sharableId,
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
        client_id: process.env.PLAID_CLIENT_ID, // Add your client_id here
      secret: process.env.PLAID_SECRET // Add your secret here
       }
       const response = await plaidClient.linkTokenCreate(tokenParams);
       return parseStringify({linkToken:response.data.link_token});
     }catch(error){
      console.log(error);
     }
  }
  export const exchangePublicToken = async({publicToken,user}:exchangePublicTokenProps)=>{
    try{
          const response = await plaidClient.itemPublicTokenExchange({
            public_token:publicToken,
          });
          const accessToken = response.data.access_token;
          const itemId = response.data.item_id;
          const accountResponse = await plaidClient.accountsGet({
            access_token:accessToken,
          });
          const accountData= accountResponse.data.accounts[0];

          const request : ProcessorTokenCreateRequest = {
                   access_token:accessToken,
                   account_id:accountData.account_id,
                   processor:"dwolla" as ProcessorTokenCreateRequestProcessorEnum,
          };
          const ProcessorTokenResponse = await plaidClient.processorTokenCreate(request);
          const processorToken = ProcessorTokenResponse.data.processor_token;

          const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId:user.dwollaCustomerId,
            processorToken,
            bankName:accountData.name,
          });

          if(!fundingSourceUrl) {
            console.log("meerror");
            throw Error;
          }

          await createBankAccount({
            userId:user.$id,
            bankId:itemId,
            accountId:accountData.account_id,
            accessToken,
            fundingSourceUrl,
            sharableId:encryptId(accountData.account_id),
          });
          revalidatePath("/");
          return parseStringify({
            publicTokenExchange:"complete"
          });
    }
    catch(error){
       console.log("meerror");
      console.log("An error occured while creating token:", error);
    }
  }