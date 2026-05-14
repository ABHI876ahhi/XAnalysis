import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App'
import { FaArrowLeft, FaTrashAlt } from 'react-icons/fa'
import { BsExclamationTriangle } from 'react-icons/bs'
import { motion, AnimatePresence } from 'motion/react'

function InterviewHistory() {
    const [interviews, setInterviews] = useState([])
    const [deleteTarget, setDeleteTarget] = useState(null)  // { id, role }
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const getMyInterviews = async () => {
            try {
                const result = await axios.get(ServerUrl + "/api/interview/get-interview", { withCredentials: true })
                setInterviews(result.data)
            } catch (error) {
                console.log(error)
            }
        }
        getMyInterviews()
    }, [])

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await axios.delete(ServerUrl + `/api/interview/delete/${deleteTarget.id}`, { withCredentials: true })
            setInterviews(prev => prev.filter(i => i._id !== deleteTarget.id))
        } catch (error) {
            console.log(error)
        } finally {
            setDeleting(false)
            setDeleteTarget(null)
        }
    }

    return (
        <div className='min-h-screen bg-black py-10 text-white'>
            <div className='w-[90vw] lg:w-[70vw] max-w-[90%] mx-auto'>

                {/* Header */}
                <div className='mb-10 w-full flex items-start gap-4 flex-wrap'>
                    <button
                        onClick={() => navigate("/")}
                        className='mt-1 p-3 rounded-full bg-white/10 shadow hover:bg-white/20 transition'>
                        <FaArrowLeft className='text-gray-300' />
                    </button>
                    <div>
                        <h1 className='text-3xl font-bold flex-nowrap text-white'>Interview History</h1>
                        <p className='text-gray-400 mt-2'>Track your past interviews and performance reports</p>
                    </div>
                </div>

                {/* Empty State */}
                {interviews.length === 0 ? (
                    <div className='bg-black border border-white/20 p-10 rounded-2xl shadow text-center'>
                        <p className='text-gray-400'>No interviews found. Start your first interview.</p>
                    </div>
                ) : (
                    <div className='grid gap-6'>
                        {interviews.map((item, index) => (
                            <div
                                key={index}
                                className='bg-black p-6 rounded-2xl shadow-md hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300 border border-white/10 group'
                            >
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                                    {/* Info — clickable to report */}
                                    <div
                                        className='flex-1 cursor-pointer'
                                        onClick={() => navigate(`/report/${item._id}`)}
                                    >
                                        <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition">
                                            {item.role}
                                        </h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {item.experience} • {item.mode}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* Right: Score + Status + Delete */}
                                    <div className='flex items-center gap-4'>

                                        {/* SCORE */}
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-yellow-400">
                                                {item.finalScore || 0}/10
                                            </p>
                                            <p className="text-xs text-gray-400">Overall Score</p>
                                        </div>

                                        {/* STATUS BADGE */}
                                        <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                                            item.status === "completed"
                                                ? "bg-yellow-400/10 text-yellow-400"
                                                : "bg-white/10 text-gray-400"
                                        }`}>
                                            {item.status}
                                        </span>

                                        {/* DELETE BUTTON */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteTarget({ id: item._id, role: item.role })
                                            }}
                                            className='p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition opacity-0 group-hover:opacity-100'
                                            title='Delete interview'
                                        >
                                            <FaTrashAlt size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {/* ── Delete Confirmation Modal ── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4'
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: 30 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className='w-full max-w-md bg-[#0d0d0d] border border-red-500/30 rounded-3xl p-8 shadow-2xl text-white'
                        >
                            {/* Icon */}
                            <div className='flex justify-center mb-6'>
                                <div className='bg-red-500/10 border border-red-500/30 w-16 h-16 rounded-2xl flex items-center justify-center'>
                                    <FaTrashAlt size={26} className='text-red-400' />
                                </div>
                            </div>

                            <h2 className='text-2xl font-bold text-center mb-2'>Delete Interview?</h2>
                            <p className='text-gray-400 text-center text-sm leading-relaxed mb-1'>
                                You are about to permanently delete:
                            </p>
                            <p className='text-center font-semibold text-white mb-8'>
                                "{deleteTarget.role}"
                            </p>
                            <p className='text-red-400 text-center text-xs mb-8'>
                                This action cannot be undone. All scores and reports will be lost.
                            </p>

                            {/* Actions */}
                            <div className='flex gap-3'>
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleting}
                                    className='flex-1 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition text-sm disabled:opacity-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleting}
                                    className='flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold transition text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}

export default InterviewHistory
