import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation';
import {
    usePlaidLink,
    PlaidLinkOptions,
    PlaidLinkOnSuccess,
  } from 'react-plaid-link';
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions';
import Image from 'next/image';


const PlaidLink = ({user,variant}:PlaidLinkProps) => {
    const router = useRouter();
    const [token,settoken] = useState('');
    useEffect(()=>{
      const getLinkToken = async () => {
        const data = await createLinkToken(user);
        settoken(data?.linkToken);
      }
      getLinkToken();
    },[user]);
    const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token:string)=>{
         await exchangePublicToken({
            publicToken:public_token,
            user,
         })
         console.log(public_token)
        router.push('/');
    },[user]);
    const config: PlaidLinkOptions = {
       
        token,
        onSuccess
    }
    const {open,ready,error} = usePlaidLink(config);
  return (
    
      <>
      {variant === 'primary'?
      (
      <Button onClick={()=>{
        (error && console.log(error))
        open()
        }} disabled={!ready} className='plaidlink-primary'>
         Connect bank
       
        
      </Button>
      ):(variant === 'ghost')?
      (
      <Button className='plaidlink-ghost' onClick ={()=>open()} variant = "ghost">
       <Image src="/icons/connect-bank.svg" alt = "connect bank" width={24} height={24}/>
       <p className='hidden text-16 font-semibold text-black-2 xl:block'>Connect Bank</p>
      </Button>
      ):
      (
      <Button className='plaidlink-default' onClick ={()=>open()}>
       
        <Image src="/icons/connect-bank.svg" alt = "connect bank" width={24} height={24}/>
        <p className='text-16 font-semibold text-black-2'>Connect Bank</p>
      </Button>
      )
      }
      </>
   
  )
}

export default PlaidLink
