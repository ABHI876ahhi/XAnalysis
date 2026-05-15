import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BsRobot, BsX, BsSend } from 'react-icons/bs';
import axios from 'axios';
import { ServerUrl } from '../App';
import Typewriter from './Typewriter';
import AICoachIcon from '../assets/ai-coach-3d.png';

function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hi! I am your AI Coach. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // true only for post-interview shimmer
    const [interviewId, setInterviewId] = useState(null);
    const [latestAiIndex, setLatestAiIndex] = useState(0); // which AI message gets Typewriter
    const messagesEndRef = useRef(null);

    // Listen for auto-open from report page
    useEffect(() => {
        const handleOpenChat = async (e) => {
            setIsOpen(true);
            if (e.detail?.interviewId) {
                setInterviewId(e.detail.interviewId);
                setMessages([]);
                setIsAnalyzing(true);
                setIsLoading(true);

                try {
                    const result = await axios.post(ServerUrl + '/api/ai/chat', {
                        interviewId: e.detail.interviewId,
                        message: "Please provide the Strength/Weakness analysis and coaching tips now.",
                        conversationHistory: []
                    }, { withCredentials: true });

                    const newMsgs = [{ role: 'ai', text: result.data.reply }];
                    setMessages(newMsgs);
                    setLatestAiIndex(0);
                } catch (error) {
                    console.error('Error fetching initial analysis:', error);
                    setMessages([{ role: 'ai', text: 'Sorry, I could not generate the analysis right now. How else can I help?' }]);
                    setLatestAiIndex(0);
                } finally {
                    setIsLoading(false);
                    setIsAnalyzing(false);
                }
            }
        };

        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user', text: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);
        setIsAnalyzing(false); // regular chat — animated dots, not shimmer

        try {
            const result = await axios.post(ServerUrl + '/api/ai/chat', {
                interviewId,
                message: userMsg,
                conversationHistory: messages
            }, { withCredentials: true });

            const updatedMessages = [...newMessages, { role: 'ai', text: result.data.reply }];
            setMessages(updatedMessages);
            setLatestAiIndex(updatedMessages.length - 1);
        } catch (error) {
            console.error('Error sending message:', error);
            // isAuth returns {message:...}, AI errors return {reply:...} — handle both
            const serverMsg = error.response?.data?.reply || error.response?.data?.message;
            let errorMsg;
            if (!error.response) {
                errorMsg = '⚠️ Cannot reach the server. Make sure the backend is running.';
            } else if (error.response.status === 400 && serverMsg?.includes('token')) {
                errorMsg = '🔒 Please log in first to use the AI Coach.';
            } else {
                errorMsg = serverMsg || 'Sorry, I am having trouble connecting right now.';
            }
            const updatedMessages = [...newMessages, { role: 'ai', text: errorMsg }];
            setMessages(updatedMessages);
            setLatestAiIndex(updatedMessages.length - 1);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-80 sm:w-96 h-[30rem] bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-black"
                    >
                        {/* Header */}
                        <div className="bg-white/50 backdrop-blur-md p-4 flex justify-between items-center border-b border-black/10">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg">
                                    <img src={AICoachIcon} alt="AI Coach" className="w-8 h-8 drop-shadow-md" />
                                </div>
                                <h3 className="font-bold text-black tracking-tight">AI Coach</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-black/50 hover:text-black transition">
                                <BsX size={24} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-black text-white rounded-tr-sm' : 'bg-white text-black rounded-tl-sm'}`}>
                                        {msg.role === 'user' ? (
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        ) : (
                                            // Only animate the latest AI reply; others display instantly
                                            idx === latestAiIndex && !isLoading ? (
                                                <Typewriter text={msg.text} speed={12} className="text-sm whitespace-pre-wrap" />
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex justify-start">
                                    {isAnalyzing ? (
                                        // Shimmer skeleton for post-interview analysis
                                        <div className="max-w-[80%] p-3 rounded-2xl bg-white shadow-sm rounded-tl-sm relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-pulse" />
                                            <p className="text-sm font-medium relative z-10 text-black/60 animate-pulse">
                                                XAnalysis is analyzing your response...
                                            </p>
                                        </div>
                                    ) : (
                                        // Bouncing dots for regular chat replies
                                        <div className="p-3 rounded-2xl bg-white shadow-sm rounded-tl-sm flex items-center gap-1.5 px-4">
                                            {[0, 1, 2].map(i => (
                                                <motion.span
                                                    key={i}
                                                    className="w-2 h-2 bg-black/30 rounded-full block"
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-black/10 bg-white/50 backdrop-blur-md">
                            <div className="flex items-center bg-white border border-black/10 shadow-sm rounded-full px-4 py-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-transparent outline-none text-sm text-black placeholder-black/40 font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="text-black hover:text-yellow-600 disabled:text-black/30 ml-2 transition"
                                >
                                    <BsSend size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-black/5 flex items-center justify-center hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition group"
                >
                    <div className="relative">
                        <img src={AICoachIcon} alt="AI Coach" className="w-10 h-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                </motion.button>
            )}
        </div>
    );
}

export default AIAssistant;
