import React, { useState, useEffect, useRef } from 'react'
import Step1SetUp from '../components/Step1SetUp'
import Step2Interview from '../components/Step2Interview'
import Step3Report from '../components/Step3Report'
import { motion, AnimatePresence } from 'motion/react'
import { BsExclamationTriangle } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'

function InterviewPage() {
    const [step, setStep] = useState(1)
    const [interviewData, setInterviewData] = useState(null)
    const [showExitWarning, setShowExitWarning] = useState(false)
    const navigate = useNavigate()
    // Tracks whether the back-button triggered the modal (so we can re-push state on "Continue")
    const backButtonTriggered = useRef(false)

    // ── Block browser back button during Step 2 ─────────────────────────────
    useEffect(() => {
        if (step !== 2) return;

        // Push a dummy history entry so the back button pops THIS entry first
        // instead of leaving the page immediately
        window.history.pushState({ interviewGuard: true }, '');

        const handlePopState = (e) => {
            // Back button was pressed — show our warning instead of navigating
            backButtonTriggered.current = true;
            setShowExitWarning(true);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [step]);

    // ── Block browser tab close / refresh during Step 2 ─────────────────────
    useEffect(() => {
        if (step !== 2) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ''; // Required for Chrome
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [step]);

    // Called when user clicks our "Exit Interview" button
    const handleExitRequest = () => {
        backButtonTriggered.current = false;
        setShowExitWarning(true);
    };

    // User clicked "Continue Interview" — re-push the guard entry so back is blocked again
    const handleCancelExit = () => {
        setShowExitWarning(false);
        if (backButtonTriggered.current) {
            // Re-push the guard so the next back press is caught again
            window.history.pushState({ interviewGuard: true }, '');
            backButtonTriggered.current = false;
        }
    };

    // User confirmed exit
    const handleConfirmExit = () => {
        window.speechSynthesis?.cancel();
        setShowExitWarning(false);
        backButtonTriggered.current = false;
        // Navigate forward then replace, so the history stack doesn't take them back into the interview
        navigate('/', { replace: true });
    };

    return (
        <div className='min-h-screen bg-black relative'>

            {/* Step 1: Setup */}
            {step === 1 && (
                <Step1SetUp onStart={(data) => {
                    setInterviewData(data);
                    setStep(2);
                }} />
            )}

            {/* Step 2: Live Interview */}
            {step === 2 && (
                <div className='relative'>
                    {/* Exit button — fixed top-right */}
                    <button
                        onClick={handleExitRequest}
                        className='fixed top-5 right-5 z-[100] bg-black border border-red-500/50 text-red-400 hover:bg-red-500/10 transition px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg'
                    >
                        <BsExclamationTriangle size={15} />
                        Exit Interview
                    </button>

                    <Step2Interview
                        interviewData={interviewData}
                        onFinish={(report) => {
                            setInterviewData(report);
                            setStep(3);
                        }}
                    />
                </div>
            )}

            {/* Step 3: Report */}
            {step === 3 && (
                <Step3Report report={interviewData} />
            )}


            {/* ── Exit Warning Modal ── */}
            <AnimatePresence>
                {showExitWarning && (
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
                                    <BsExclamationTriangle size={32} className='text-red-400' />
                                </div>
                            </div>

                            {/* Text */}
                            <h2 className='text-2xl font-bold text-center mb-2'>Exit Interview?</h2>
                            <p className='text-gray-400 text-center text-sm leading-relaxed mb-8'>
                                Your interview is still in progress. If you leave now, your current session will be
                                abandoned and{' '}
                                <span className='text-red-400 font-semibold'>your answers will not be saved.</span>
                            </p>

                            {/* Actions */}
                            <div className='flex gap-3'>
                                <button
                                    onClick={handleCancelExit}
                                    className='flex-1 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition text-sm'
                                >
                                    Continue Interview
                                </button>
                                <button
                                    onClick={handleConfirmExit}
                                    className='flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold transition text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                >
                                    Yes, Exit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}

export default InterviewPage
