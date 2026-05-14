import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import { motion } from "motion/react";
import {
  BsRobot,
  BsMic,
  BsClock,
  BsBarChart,
  BsFileEarmarkText
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import { useNavigate } from 'react-router-dom';
import AuthModel from '../components/AuthModel';
import Footer from '../components/Footer';
import hrImg from "../assets/HR.png";
import techImg from "../assets/tech.png";
import confidenceImg from "../assets/confi.png";
import creditImg from "../assets/credit.png";
import evalImg from "../assets/ai-ans.png";
import resumeImg from "../assets/resume.png";
import pdfImg from "../assets/pdf.png";
import analyticsImg from "../assets/history.png";
import PerformanceDashboard from '../components/PerformanceDashboard';
import logo_3d from "../assets/logo_3d.png"
import chatbot_3d from "../assets/chatbot_3d.png"

function Home() {
  const { userData } = useSelector((state) => state.user);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const steps = [
    {
      icon: <img src={chatbot_3d} className="w-8 h-8 object-contain" />,
      step: "STEP 1",
      title: "Role & Experience Selection",
      desc: "AI adjusts difficulty based on selected job role.",
    },
    {
      icon: <BsMic size={24} />,
      step: "STEP 2",
      title: "Smart Voice Interview",
      desc: "Dynamic follow-up questions based on your answers.",
    },
    {
      icon: <BsClock size={24} />,
      step: "STEP 3",
      title: "Timer Based Simulation",
      desc: "Real interview pressure with time tracking.",
    },
  ];

  const capabilities = [
    {
      image: evalImg,
      icon: <BsBarChart size={20} />,
      title: "AI Answer Evaluation",
      desc: "Scores communication, technical accuracy and confidence.",
    },
    {
      image: resumeImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "Resume Based Interview",
      desc: "Project-specific questions based on uploaded resume.",
    },
    {
      image: pdfImg,
      icon: <BsFileEarmarkText size={20} />,
      title: "Downloadable PDF Report",
      desc: "Detailed strengths, weaknesses and improvement insights.",
    },
    {
      image: analyticsImg,
      icon: <BsBarChart size={20} />,
      title: "History & Analytics",
      desc: "Track progress with performance graphs and topic analysis.",
    },
  ];

  const modes = [
    { img: hrImg, title: "HR Interview Mode", desc: "Behavioral and communication based evaluation." },
    { img: techImg, title: "Technical Mode", desc: "Deep technical questioning based on selected role." },
    { img: confidenceImg, title: "Confidence Detection", desc: "Basic tone and voice analysis insights." },
    { img: creditImg, title: "Credits System", desc: "Unlock premium interview sessions easily." },
  ];

  return (
    <div className='min-h-screen bg-black flex flex-col relative overflow-x-hidden'>
      {/* Radial Glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <div className='flex-1 px-6 py-20 relative z-10'>
        <div className='max-w-6xl mx-auto'>

          {/* ── Hero Section ── */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 mb-32 items-center'>

            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className='space-y-8'
            >
              <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10'>
                <HiSparkles className="text-yellow-400" />
                <span className='text-sm text-gray-300 font-medium tracking-wide'>XAnalysis 2026 Edition</span>
              </div>

              <h1 className='text-5xl md:text-7xl font-bold leading-[1.1] text-white tracking-tight' style={{ fontFamily: 'Georgia, serif' }}>
                AI-Powered Smart Interview Platform
              </h1>

              <p className='text-2xl text-yellow-400 font-semibold tracking-wide'>
                Practice Interviews with AI Intelligence.
              </p>

              <div className='pt-4 flex gap-4'>
                <motion.button
                  onClick={() => {
                    if (!userData) { setShowAuth(true); return; }
                    navigate("/interview");
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='relative overflow-hidden bg-yellow-400 text-black px-10 py-4 rounded-2xl font-bold shadow-[0_0_30px_rgba(255,255,0,0.3)] hover:shadow-[0_0_40px_rgba(255,255,0,0.5)] transition group'
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 -translate-x-full group-hover:animate-[shimmer_1s_infinite] skew-x-12" />
                  <span className="relative z-10">Start Interview</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    if (!userData) { setShowAuth(true); return; }
                    navigate("/history");
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='border border-white/20 px-10 py-4 rounded-2xl font-bold hover:bg-white/5 transition text-white'
                >
                  View History
                </motion.button>
              </div>
            </motion.div>

            {/* Right: 3D Pulse Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              onMouseMove={handleMouseMove}
              className='h-[500px] w-full bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-center relative overflow-hidden backdrop-blur-md'
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px]" />
              <motion.div
                animate={{
                  rotateX: mousePos.y * -0.05,
                  rotateY: mousePos.x * 0.05,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className='w-64 h-64 relative flex justify-center items-center'
              >
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="w-32 h-32 flex items-center justify-center z-10 relative">
                  <img src={logo_3d} alt="3D Logo" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-bounce" />
                </div>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                    className="absolute inset-0 border-2 border-yellow-400/50 rounded-full"
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>


          {/* ── 3-Step Flow ── */}
          <div className='flex flex-col md:flex-row justify-center items-center gap-10 mb-32'>
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 + index * 0.2 }}
                whileHover={{ scale: 1.06 }}
                className={`
                  relative bg-black rounded-3xl border-2 border-white/10
                  hover:border-yellow-400/60 p-10 w-80 max-w-[90%]
                  shadow-md hover:shadow-[0_0_20px_rgba(255,255,0,0.1)]
                  transition-all duration-300
                  ${index === 0 ? "rotate-[-4deg]" : ""}
                  ${index === 1 ? "rotate-[3deg] md:-mt-6 shadow-xl" : ""}
                  ${index === 2 ? "rotate-[-3deg]" : ""}
                `}
              >
                <div className='absolute -top-8 left-1/2 -translate-x-1/2 bg-black border-2 border-yellow-400 text-yellow-400 w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,0,0.2)]'>
                  {item.icon}
                </div>
                <div className='pt-10 text-center'>
                  <div className='text-xs text-yellow-400 font-bold mb-2 tracking-widest'>{item.step}</div>
                  <h3 className='font-bold mb-3 text-lg text-white'>{item.title}</h3>
                  <p className='text-sm text-gray-400 leading-relaxed'>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>


          {/* ── Advanced AI Capabilities ── */}
          <div className='mb-32'>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className='text-4xl font-bold text-center mb-16 text-white'
            >
              Advanced AI{" "}
              <span className="text-yellow-400">Capabilities</span>
            </motion.h2>

            <div className='grid md:grid-cols-2 gap-10'>
              {capabilities.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className='bg-black border border-white/10 rounded-3xl p-8 shadow-sm hover:shadow-[0_0_20px_rgba(255,255,0,0.07)] hover:border-yellow-400/20 transition-all'
                >
                  <div className='flex flex-col md:flex-row items-center gap-8'>
                    <div className='w-full md:w-1/2 flex justify-center'>
                      <img src={item.image} alt={item.title} className='w-full h-auto object-contain max-h-64' />
                    </div>
                    <div className='w-full md:w-1/2'>
                      <div className='bg-yellow-400/10 text-yellow-400 w-12 h-12 rounded-xl flex items-center justify-center mb-6'>
                        {item.icon}
                      </div>
                      <h3 className='font-bold mb-3 text-xl text-white'>{item.title}</h3>
                      <p className='text-gray-400 text-sm leading-relaxed'>{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>


          {/* ── Multiple Interview Modes ── */}
          <div className='mb-32'>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className='text-4xl font-bold text-center mb-16 text-white'
            >
              Multiple Interview{" "}
              <span className="text-yellow-400">Modes</span>
            </motion.h2>

            <div className='grid md:grid-cols-2 gap-10'>
              {modes.map((mode, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="bg-black border border-white/10 rounded-3xl p-8 shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:border-white/20 transition-all"
                >
                  <div className='flex items-center justify-between gap-6'>
                    <div className="w-1/2">
                      <h3 className="font-bold text-xl mb-3 text-white">{mode.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{mode.desc}</p>
                    </div>
                    <div className="w-1/2 flex justify-end">
                      <img src={mode.img} alt={mode.title} className="w-28 h-28 object-contain" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>


          {/* ── Performance & Growth Dashboard ── */}
          <div className='mb-20'>
            <PerformanceDashboard userData={userData} />
          </div>


        </div>
      </div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}

      <Footer />
    </div>
  );
}

export default Home;
