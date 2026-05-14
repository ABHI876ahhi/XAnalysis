import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from "motion/react"
import { BsRobot, BsCoin, BsPencilSquare } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ServerUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import AuthModel from './AuthModel';
import ProfileSetup from './ProfileSetup';

const AVATARS = [
    '🧑', '👩', '🧔', '👨‍💼', '👩‍💼', '🧑‍💻',
    '👩‍💻', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🤵', '👸',
];

function Navbar() {
    const { userData } = useSelector((state) => state.user)
    const [showCreditPopup, setShowCreditPopup] = useState(false)
    const [showUserPopup, setShowUserPopup] = useState(false)
    const [showAuth, setShowAuth] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const navRef = useRef(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setShowCreditPopup(false)
                setShowUserPopup(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            await axios.get(ServerUrl + "/api/auth/logout", { withCredentials: true })
            dispatch(setUserData(null))
            setShowCreditPopup(false)
            setShowUserPopup(false)
            navigate("/")
        } catch (error) {
            console.log(error)
        }
    }

    // Resolve what to show in the profile button
    const profileLabel = userData
        ? (userData.avatar && userData.avatar.length <= 2
            ? userData.avatar  // emoji avatar
            : userData.name?.slice(0, 1).toUpperCase())
        : null

    return (
        <div ref={navRef} className='bg-black flex justify-center px-4 pt-6 relative z-[100]'>
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='w-full max-w-6xl bg-black/80 backdrop-blur-xl rounded-[24px] shadow-sm border border-white/10 px-8 py-4 flex justify-between items-center relative overflow-visible'
            >
                {/* Brand */}
                <div className='flex items-center gap-3 cursor-pointer group' onClick={() => navigate("/")}>
                    <div className='bg-white text-black p-2 rounded-xl group-hover:shadow-[0_0_12px_rgba(255,255,255,0.4)] transition'>
                        <BsRobot size={18} />
                    </div>
                    <h1 className='font-bold hidden md:block text-lg text-white tracking-tight'>
                        XAnalysis<span className='text-yellow-400'>.</span>
                    </h1>
                </div>

                <div className='flex items-center gap-4 relative overflow-visible'>
                    {/* Credits Button */}
                    <div className='relative'>
                        <button
                            onClick={() => {
                                if (!userData) { setShowAuth(true); return; }
                                setShowCreditPopup(!showCreditPopup)
                                setShowUserPopup(false)
                            }}
                            className='flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-400/20 transition'
                        >
                            <BsCoin size={16} />
                            {userData?.credits ?? 0} Credits
                        </button>

                        {showCreditPopup && (
                            <div className='absolute right-0 top-full mt-3 w-64 bg-[#0d0d0d] shadow-2xl border border-white/10 rounded-2xl p-5 z-[200] text-white'>
                                <p className='text-sm text-gray-300 mb-4'>Need more credits to continue interviews?</p>
                                <button onClick={() => navigate("/pricing")} className='w-full bg-yellow-400 text-black py-2 rounded-xl text-sm font-bold hover:bg-yellow-300 transition'>
                                    Buy more credits ₹
                                </button>
                            </div>
                        )}
                    </div>

                    {/* User / Avatar Button */}
                    <div className='relative'>
                        <button
                            onClick={() => {
                                if (!userData) { setShowAuth(true); return; }
                                setShowUserPopup(!showUserPopup)
                                setShowCreditPopup(false)
                            }}
                            className='w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg hover:shadow-[0_0_14px_rgba(255,255,255,0.4)] transition overflow-hidden border-2 border-transparent hover:border-yellow-400/50'
                        >
                            {userData
                                ? <span className='text-xl leading-none'>{profileLabel}</span>
                                : <FaUserAstronaut size={16} />
                            }
                        </button>

                        {showUserPopup && (
                            <div className='absolute right-0 top-full mt-3 w-56 bg-[#0d0d0d] shadow-2xl border border-white/10 rounded-2xl p-4 z-[200] text-white'>
                                {/* User Info */}
                                <div className='flex items-center gap-3 mb-4 pb-3 border-b border-white/10'>
                                    <span className='text-2xl'>{userData?.avatar || '🧑'}</span>
                                    <div className='min-w-0'>
                                        <p className='text-sm text-yellow-400 font-bold truncate'>{userData?.name}</p>
                                        <p className='text-xs text-gray-500 truncate'>{userData?.phone || userData?.email || ''}</p>
                                    </div>
                                </div>
                                <div className='space-y-1'>
                                    {/* Edit Profile */}
                                    <button
                                        onClick={() => { setShowEditProfile(true); setShowUserPopup(false) }}
                                        className='w-full text-left text-sm py-2 px-2 rounded-lg hover:bg-white/5 text-gray-300 transition flex items-center gap-2'
                                    >
                                        <BsPencilSquare size={13} className='text-yellow-400' />
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => navigate("/history")}
                                        className='w-full text-left text-sm py-2 px-2 rounded-lg hover:bg-white/5 text-gray-300 transition'
                                    >
                                        Interview History
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className='w-full text-left text-sm py-2 px-2 rounded-lg flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition'
                                    >
                                        <HiOutlineLogout size={15} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditProfile && (
                    <ProfileSetup onClose={() => setShowEditProfile(false)} />
                )}
            </AnimatePresence>
        </div>
    )
}

export default Navbar
