import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/auth'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from './redux/userSlice'
import InterviewPage from './pages/InterviewPage'
import InterviewHistory from './pages/InterviewHistory'
import Pricing from './pages/Pricing'
import InterviewReport from './pages/InterviewReport'
import AIAssistant from './components/AIAssistant'
import ProfileSetup from './components/ProfileSetup'
import { AnimatePresence } from 'motion/react'

export const ServerUrl = "http://localhost:8000"

function App() {
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)
  const [showProfileSetup, setShowProfileSetup] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/user/current-user", { withCredentials: true })
        dispatch(setUserData(result.data))
      } catch (error) {
        console.log(error)
        dispatch(setUserData(null))
      }
    }
    getUser()
  }, [dispatch])

  // Show profile setup for new phone users who haven't completed their profile
  useEffect(() => {
    if (userData && userData.isProfileComplete === false) {
      setShowProfileSetup(true)
    } else {
      setShowProfileSetup(false)
    }
  }, [userData])

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/auth' element={<Auth />} />
        <Route path='/interview' element={<InterviewPage />} />
        <Route path='/history' element={<InterviewHistory />} />
        <Route path='/pricing' element={<Pricing />} />
        <Route path='/report/:id' element={<InterviewReport />} />
      </Routes>

      <AIAssistant />

      {/* Profile setup modal for new phone users */}
      <AnimatePresence>
        {showProfileSetup && (
          <ProfileSetup onClose={() => setShowProfileSetup(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default App
