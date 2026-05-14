import React from 'react'
import { motion } from "motion/react"
import {
    FaUserTie,
    FaBriefcase,
    FaFileUpload,
    FaMicrophoneAlt,
    FaChartLine,
} from "react-icons/fa";
import { useState } from 'react';
import axios from "axios"
import { ServerUrl } from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';
function Step1SetUp({ onStart }) {
    const {userData}= useSelector((state)=>state.user)
    const dispatch = useDispatch()
    const [role, setRole] = useState("");
    const [experience, setExperience] = useState("");
    const [mode, setMode] = useState("Technical");
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [resumeText, setResumeText] = useState("");
    const [analysisDone, setAnalysisDone] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);


    const handleUploadResume = async () => {
        if (!resumeFile || analyzing) return;
        setAnalyzing(true)

        const formdata = new FormData()
        formdata.append("resume", resumeFile)

        try {
            const result = await axios.post(ServerUrl + "/api/interview/resume", formdata, { withCredentials: true })

            console.log(result.data)

            setRole(result.data.role || "");
            setExperience(result.data.experience || "");
            setProjects(result.data.projects || []);
            setSkills(result.data.skills || []);
            setResumeText(result.data.resumeText || "");
            setAnalysisDone(true);

            setAnalyzing(false);

        } catch (error) {
            console.log(error)
            setAnalyzing(false);
        }
    }

    const handleStart = async () => {
        setLoading(true)
        try {
           const result = await axios.post(ServerUrl + "/api/interview/generate-questions" , {role, experience, mode , resumeText, projects, skills } , {withCredentials:true}) 
           console.log(result.data)
           if(userData){
            dispatch(setUserData({...userData , credits:result.data.creditsLeft}))
           }
           setLoading(false)
           onStart(result.data)

        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className='min-h-screen flex items-center justify-center bg-black px-4 text-white'>

            <div className='w-full max-w-6xl bg-black rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden border border-white/20'>

                <motion.div
                    initial={{ x: -80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className='relative bg-white/5 p-12 flex flex-col justify-center border-r border-white/10'>

                    <h2 className="text-4xl font-bold text-white mb-6">
                        Start Your AI Interview
                    </h2>

                    <p className="text-gray-400 mb-10">
                        Practice real interview scenarios powered by AI.
                        Improve communication, technical skills, and confidence.
                    </p>

                    <div className='space-y-5'>

                        {
                            [
                                {
                                    icon: <FaUserTie className="text-emerald-400 text-xl" />,
                                    text: "Choose Role & Experience",
                                },
                                {
                                    icon: <FaMicrophoneAlt className="text-emerald-400 text-xl" />,
                                    text: "Smart Voice Interview",
                                },
                                {
                                    icon: <FaChartLine className="text-emerald-400 text-xl" />,
                                    text: "Performance Analytics",
                                },
                            ].map((item, index) => (
                                <motion.div key={index}
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 + index * 0.15 }}
                                    whileHover={{ scale: 1.03 }}
                                    className='flex items-center space-x-4 bg-white/5 p-4 rounded-xl shadow-sm cursor-pointer border border-white/10 hover:bg-white/10'>
                                    {item.icon}
                                    <span className='text-gray-300 font-medium'>{item.text}</span>

                                </motion.div>
                            ))
                        }
                    </div>



                </motion.div>



                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="p-12 bg-black">

                    <h2 className='text-3xl font-bold text-white mb-8'>
                        Interview SetUp
                    </h2>


                    <div className='space-y-6'>

                        <div className='relative'>
                            <FaUserTie className='absolute top-4 left-4 text-gray-400' />

                            <input type='text' placeholder='Enter role'
                                className='w-full pl-12 pr-4 py-3 border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition placeholder-gray-500'
                                onChange={(e) => setRole(e.target.value)} value={role} />
                        </div>


                        <div className='relative'>
                            <FaBriefcase className='absolute top-4 left-4 text-gray-400' />

                            <input type='text' placeholder='Experience (e.g. 2 years)'
                                className='w-full pl-12 pr-4 py-3 border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition placeholder-gray-500'
                                onChange={(e) => setExperience(e.target.value)} value={experience} />



                        </div>

                        <select value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className='w-full py-3 px-4 border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition'>

                            <option className='text-black' value="Technical">Technical Interview</option>
                            <option className='text-black' value="HR">HR Interview</option>

                        </select>

                        {!analysisDone && (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                onClick={() => document.getElementById("resumeUpload").click()}
                                className='border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-white/5 transition'>

                                <FaFileUpload className='text-4xl mx-auto text-emerald-500 mb-3' />

                                <input type="file"
                                    accept="application/pdf"
                                    id="resumeUpload"
                                    className='hidden'
                                    onChange={(e) => setResumeFile(e.target.files[0])} />

                                <p className='text-gray-400 font-medium'>
                                    {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                                </p>

                                {resumeFile && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUploadResume()
                                        }}

                                        className='mt-4 bg-white text-black px-5 py-2 rounded-lg hover:bg-gray-200 transition font-semibold'>
                                        {analyzing ? "Analyzing..." : "Analyze Resume"}



                                    </motion.button>)}

                            </motion.div>


                        )}

                        {analysisDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className='bg-white/5 border border-white/10 rounded-xl p-5 space-y-4'>
                                <h3 className='text-lg font-semibold text-white'>
                                    Resume Analysis Result</h3>

                                {projects.length > 0 && (
                                    <div>
                                        <p className='font-medium text-gray-300 mb-1'>
                                            Projects:</p>

                                        <ul className='list-disc list-inside text-gray-400 space-y-1'>
                                            {projects.map((p, i) => (
                                                <li key={i}>{p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {skills.length > 0 && (
                                    <div>
                                        <p className='font-medium text-gray-300 mb-1'>
                                            Skills:</p>

                                        <div className='flex flex-wrap gap-2'>
                                            {skills.map((s, i) => (
                                                <span key={i} className='bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm'>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        )}


                        <motion.button
                        onClick={handleStart}
                            disabled={!role || !experience || loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            className='w-full disabled:bg-gray-600 bg-white hover:bg-gray-200 text-black py-3 rounded-full text-lg font-bold transition duration-300 shadow-md'>
                            {loading ? "Staring...":"Start Interview"}


                        </motion.button>
                    </div>

                </motion.div>
            </div>

        </motion.div>
    )
}

export default Step1SetUp
