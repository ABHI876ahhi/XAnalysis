import React, { useState } from 'react'
import logo_3d from "../assets/logo_3d.png"
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

function Auth({ isModel = false }) {
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGoogleAuth = async () => {
        setError('')
        setLoading(true)
        try {
            const response = await signInWithPopup(auth, provider)
            const User = response.user
            const result = await axios.post(ServerUrl + "/api/auth/google", {
                name: User.displayName,
                email: User.email
            }, { withCredentials: true })
            dispatch(setUserData(result.data))
        } catch (err) {
            console.error("Google Auth Error:", err)
            const errorMsg = err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.'
            setError(errorMsg)
            dispatch(setUserData(null))
        } finally {
            setLoading(false)
        }
    }

    const cardCls = isModel
        ? "w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-lg border border-white/40 text-black shadow-2xl"
        : "w-full max-w-lg p-12 rounded-[32px] bg-black border border-white/20 text-white shadow-2xl"

    return (
        <div className={`w-full ${isModel ? "py-4" : "min-h-screen bg-black flex items-center justify-center px-6 py-20"}`}>
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={cardCls}
            >
                {/* Brand */}
                <div className='flex items-center justify-center gap-3 mb-6'>
                    <div className='w-10 h-10'>
                        <img src={logo_3d} alt="Logo" className='w-full h-full object-contain' />
                    </div>
                    <h2 className='font-bold text-lg tracking-wide'>XAnalysis</h2>
                </div>

                {/* Title */}
                <h1 className='text-2xl md:text-3xl font-bold text-center leading-snug mb-2'>
                    Continue with
                    <span className={`ml-2 px-3 py-1 rounded-full inline-flex items-center gap-2 font-semibold tracking-tight ${isModel ? "bg-black text-yellow-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        <IoSparkles size={16} />
                        AI Smart Interview
                    </span>
                </h1>
                <p className={`text-center text-sm leading-relaxed mb-8 ${isModel ? "text-black/60" : "text-gray-400"}`}>
                    Sign in to start AI-powered mock interviews and track your progress.
                </p>

                {/* Error */}
                {error && (
                    <div className='mb-4 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center'>
                        {error}
                    </div>
                )}

                {/* Google Button */}
                <motion.button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-center gap-3 py-3 rounded-full shadow-md transition font-semibold disabled:opacity-60
                        ${isModel ? "bg-white border border-black/10 hover:bg-gray-50 text-black" : "bg-white/10 hover:bg-white/20 text-white"}`}
                >
                    <FcGoogle size={20} />
                    {loading ? 'Signing in...' : 'Continue with Google'}
                </motion.button>

            </motion.div>
        </div>
    )
}

export default Auth
