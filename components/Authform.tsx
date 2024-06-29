'use client';
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import CustomFormfield from './CustomFormfield';
import { Loader2 } from 'lucide-react';
import { AuthformSchema } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { signUp, signIn, getLoggedInUser} from '@/lib/actions/user.actions';
import PlaidLink from './PlaidLink';


const AuthForm = ({type}:{type:string}) => {
  


  const router = useRouter();
  const [user,setuser] = useState(null);
  
  const [isloading,setloading] = useState(false);
  const formSchema= AuthformSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email:"",
      password:"",
      firstName:"",
      lastName:"",
      address1:"",
      state:"",
      postalCode:"",
      dateOfBirth:"",
      ssn:"",
      city:"",
    },
  })
 
  // 2. Define a submit handler.
  const onSubmit = async(data: z.infer<typeof formSchema>)=>{
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setloading(true);
   
    try{
     
      //sign up with Appwrite and create a plain link token
      if(type === 'sign-up'){
        const userData = {
          firstName:data.firstName!,
          lastName:data.lastName!,
          address1:data.address1!,
          city:data.city!,
          state:data.state!,
          postalCode:data.postalCode!,
          dateOfBirth:data.dateOfBirth!,
          ssn:data.ssn!,
          email:data.email,
          password:data.password
    
        }
        console.log(userData);
        const newUser = await signUp(userData);

        setuser(newUser);
      }
      if(type === 'sign-in'){
           const response = await signIn({
            email:data.email,
            password:data.password,
           })
           if(response){
               router.push("/");
           }
      }
    }catch(error){
       console.log(error);
    }finally{
      setloading(false);
    }
    setloading(false);
   
  }
  return (
    <section className="auth-form">
      <header className='flex flex-col gap-5 md:gap-8'>
      <Link href="/" 
        className='cursor-pointer items-center gap-1 flex'>
            <Image 
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Horizon logo"
            className='size-[24px] max-xl:size-14'
            />
            <h1 className='sidebar-logo'>Horizon</h1>
        </Link>
        <div className='flex flex-col gap-1 md:gap-3'>
                  <h1 className="text-24 lg:text-36 font-semibold text-gray-900">{user?'Link Account' : type==='sign-in'?'Sign-In':'Sign-Up'}</h1>
                  <p className='text-16 font-normal text-gray-600'>{user?'Link your accout to get started':'Please enter your details'}</p>
        </div>
      </header>
      {user?
      (<div className="flex flex-col gap-4"> 
          <PlaidLink user={user} variant='primary'/>
       </div>
      ): (
        <>
       <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {type==='sign-up' && (
            <>
            <div className='flex gap-4'>
              <CustomFormfield control={form.control} name="firstName" placeholder="Enter your FirstName" label="FirstName" Type="text"/>
              <CustomFormfield control={form.control} name="lastName" placeholder="Enter your LastName" label="LastName" Type="text"/>
            </div>
              <CustomFormfield control={form.control} name="address1" placeholder="Enter your specific address" label="Address" Type="text"/>
              <CustomFormfield control={form.control} name="city" placeholder="Enter your city" label="City" Type="text"/>
            <div className='flex gap-4'>
              <CustomFormfield control={form.control} name="state" placeholder="eg: Maharashtra" label="State" Type="text"/>
              <CustomFormfield control={form.control} name="postalCode" placeholder="eg: 413003" label="Postal Code" Type="text"/>
            </div>
            <div className='flex gap-4'>
              <CustomFormfield control={form.control} name="dateOfBirth" placeholder="yyyy-mm-dd" label="Date Of Birth" Type="text"/>
              <CustomFormfield control={form.control} name="ssn" placeholder="eg: 1234" label="SSN" Type="text"/>
            </div>
            </>
          )}
          <CustomFormfield control={form.control} name="email" placeholder="Enter your email" label="Email" Type="text"/>
          <CustomFormfield control={form.control} name="password" placeholder="Enter your password" label="Password" Type="password"/>
          <div className='flex flex-col gap-4'>
         <Button type="submit" className='form-btn' disabled={isloading}>{isloading ? <><Loader2 size={20} className="animate-spin"/> &nbsp; Loading...</> : type==='sign-in'?'Sign In' : 'Sign Up'}</Button>
          </div>
         <footer className='flex justify-center gap-1'>
          <p className='text-14 font-normal text-gray-600'>{type === 'sign-in'? "Don't have an account?":"Already have an account?"}</p>
          <Link className='form-link' href={type==='sign-in'?"/Sign-up" : "/Sign-in"}>{type==='sign-in'?"Sign Up" : "Sign In"}</Link>
         </footer>
        
       </form>
     </Form>
     </>
      )}
    </section>
  )
}

export default AuthForm;
