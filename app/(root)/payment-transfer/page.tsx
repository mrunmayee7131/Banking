import HeaderBox from '@/components/headerBox'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import React from 'react'

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  if (loggedIn){ 
  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })
  console.log(loggedIn);
  console.log("id is",loggedIn.$id);
  if(!accounts) return;
  
  const accountsData = accounts?.data;

  return (
    <section className="payment-transfer">
      <HeaderBox 
        title="Payment Transfer"
        subtext="Please provide any specific details or notes related to the payment transfer"
      />

      <section className="size-full pt-5">
        <PaymentTransferForm accounts={accountsData} />
      </section>
    </section>
  )
}else{
  return (
    <>
    </>
  )
}
}

export default Transfer