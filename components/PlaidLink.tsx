import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation';
import {
    usePlaidLink,
    PlaidLinkOptions,
    PlaidLinkOnSuccess,
  } from 'react-plaid-link';
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions';


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
      <Button>
        Connect bank
      </Button>
      ):
      (
      <Button>
        Connect bank
      </Button>
      )
      }
      </>
   
  )
}

export default PlaidLink
