import React from 'react'
import { FormControl, FormField, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Control, FieldPath } from 'react-hook-form'
import { z } from "zod"
import { AuthformSchema } from '@/lib/utils'
const formSchema = AuthformSchema('sign-up');
interface CustomInput{
     control: Control<z.infer<typeof formSchema>>,
     label:string,
     placeholder:string,
     name:FieldPath<z.infer<typeof formSchema>>,
     Type:string,
}
const CustomFormfield = ({control,label,placeholder,name,Type}:CustomInput) => {
  return (
    <div>
       <FormField
           control={control}
           name={name}
           render={({ field }) => (
             <div className='form-item'>
            <FormLabel className='form-label'>
              {label}
            </FormLabel>
            <div className='flex w-full flex-col'>
                 <FormControl>
                  <Input className='input-class' placeholder={placeholder} {...field} type={Type}/>
                 </FormControl>
                 <FormMessage className='form-message mt-2'/>
            </div>
             </div>
           )}
         />
    </div>
  )
}

export default CustomFormfield
