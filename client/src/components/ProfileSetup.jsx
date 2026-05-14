import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BsCheck2 } from 'react-icons/bs';
import chatbot_3d from "../assets/chatbot_3d.png"
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

const AVATARS = [
    '🧑', '👩', '🧔', '👨‍💼', '👩‍💼', '🧑‍💻',
    '👩‍💻', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🤵', '👸',
];

function ProfileSetup({ onClose }) {
    const dispatch = useDispatch();
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('🧑');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        if (!name.trim()) { setError('Please enter your name'); return; }
        setLoading(true);
        try {
            const res = await axios.put(ServerUrl + '/api/auth/profile', {
                name: name.trim(),
                avatar: selectedAvatar
            }, { withCredentials: true });
            dispatch(setUserData(res.data));
            onClose();
        } catch (err) {
            setError('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4'
        >
            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className='w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl text-white'
            >
                {/* Header */}
                <div className='flex items-center justify-center gap-3 mb-6'>
                    <div className='w-10 h-10'>
                        <img src={chatbot_3d} alt="AI Coach" className='w-full h-full object-contain' />
                    </div>
                    <h2 className='text-2xl font-bold tracking-tight'>Set Up Profile</h2>
                </div>
                <p className='text-gray-400 text-sm text-center mb-8'>
                    Welcome! Choose an avatar and tell us your name to get started.
                </p>

                {/* Avatar Grid */}
                <div className='mb-6'>
                    <p className='text-xs text-gray-500 font-semibold mb-3 tracking-widest uppercase'>Choose Avatar</p>
                    <div className='grid grid-cols-6 gap-2'>
                        {AVATARS.map((avatar) => (
                            <button
                                key={avatar}
                                onClick={() => setSelectedAvatar(avatar)}
                                className={`text-2xl w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                                    ${selectedAvatar === avatar
                                        ? 'bg-yellow-400/20 border-2 border-yellow-400 scale-110 shadow-[0_0_12px_rgba(255,255,0,0.2)]'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {avatar}
                                {selectedAvatar === avatar && (
                                    <span className='absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full w-4 h-4 flex items-center justify-center'>
                                        <BsCheck2 size={8} />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name Input */}
                <div className='mb-6'>
                    <p className='text-xs text-gray-500 font-semibold mb-2 tracking-widest uppercase'>Your Name</p>
                    <input
                        type='text'
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder='Enter your name...'
                        className='w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-white/30 outline-none focus:border-yellow-400 transition text-sm'
                        autoFocus
                    />
                </div>

                {/* Preview */}
                <div className='mb-6 flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/5'>
                    <span className='text-4xl'>{selectedAvatar}</span>
                    <div>
                        <p className='text-white font-bold'>{name || 'Your Name'}</p>
                        <p className='text-gray-500 text-xs'>XAnalysis Member</p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className='mb-4 text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl'>
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className='flex gap-3'>
                    <button
                        onClick={onClose}
                        className='flex-1 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 font-semibold transition text-sm'
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className='flex-1 py-3 rounded-2xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition text-sm shadow-[0_0_20px_rgba(255,255,0,0.2)] disabled:opacity-60'
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ProfileSetup;
