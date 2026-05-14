import React from 'react'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { BsX } from "react-icons/bs";
import Auth from '../pages/Auth';

function AuthModel({onClose}) {
    const {userData} = useSelector((state)=>state.user)

    useEffect(()=>{
        if(userData){
            onClose()
        }
    },[userData , onClose])

  return (
    /* Backdrop — click outside to close */
    <div
      className='fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4'
      onClick={onClose}
    >
        <div
          className='relative w-full max-w-md'
          onClick={(e) => e.stopPropagation()} /* prevent card click from closing */
        >
            {/* Visible close button — top-right corner of the card */}
            <button
              onClick={onClose}
              className='absolute -top-4 -right-4 z-10 bg-black border border-white/20 text-white hover:text-yellow-400 hover:border-yellow-400/50 transition w-9 h-9 rounded-full flex items-center justify-center shadow-lg'
              title="Close"
            >
              <BsX size={22}/>
            </button>

            <Auth isModel={true}/>
        </div>
    </div>
  )
}

export default AuthModel
