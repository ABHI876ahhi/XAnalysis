import React from 'react'
import logo_3d from '../assets/logo_3d.png'
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa'

function Footer() {
  return (
    <div className='bg-black flex justify-center px-4 pb-10 py-4 pt-10 text-white'>
      <div className='w-full max-w-6xl bg-black rounded-[24px] shadow-sm border border-white/10 py-12 px-8'>
        
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6'>
          {/* Column 1: Branding & About */}
          <div className='flex flex-col items-center md:items-start text-center md:text-left'>
            <div className='flex items-center gap-3 mb-4 cursor-pointer'>
                <div className='w-8 h-8 group-hover:scale-110 transition-transform duration-300'>
                    <img src={logo_3d} alt="XAnalysis Logo" className='w-full h-full object-contain' />
                </div>
                <h2 className='font-bold text-xl tracking-wide'>XAnalysis</h2>
            </div>
            <p className='text-gray-400 text-sm max-w-xs'>
              The definitive AI-powered interview platform for 2026. Practice, analyze, and perfect your skills.
            </p>
          </div>

          {/* Column 2: Connect */}
          <div className='flex flex-col items-center md:items-start'>
            <h3 className='font-semibold text-lg mb-4 text-gray-200'>Connect</h3>
            <div className='flex gap-4'>
              <a href="#" className='text-gray-400 hover:text-white hover:scale-110 transition-transform p-2 bg-white/5 rounded-full'><FaLinkedin size={18} /></a>
              <a href="#" className='text-gray-400 hover:text-white hover:scale-110 transition-transform p-2 bg-white/5 rounded-full flex items-center justify-center font-bold font-serif w-8 h-8'>X</a>
              <a href="#" className='text-gray-400 hover:text-white hover:scale-110 transition-transform p-2 bg-white/5 rounded-full'><FaGithub size={18} /></a>
            </div>
          </div>

          {/* Column 3: Support */}
          <div className='flex flex-col items-center md:items-start'>
            <h3 className='font-semibold text-lg mb-4 text-gray-200'>Support</h3>
            <p className='text-gray-400 text-sm mb-2'>We're here to help.</p>
            <a href="mailto:support@xanalysis.com" className='text-yellow-400 hover:text-yellow-300 font-mono text-sm tracking-tight'>
              support@xanalysis.com
            </a>
          </div>

          {/* Column 4: Badge */}
          <div className='flex flex-col items-center md:items-end justify-center'>
            <div className='bg-white text-black px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2'>
              <span className='text-sm font-black tracking-widest uppercase'>Built in India</span>
              <span className='text-lg'>🇮🇳</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className='mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-4'>
          <p className='text-gray-500 text-sm font-medium'>&copy; {new Date().getFullYear()} XAnalysis. All rights reserved.</p>
        </div>

      </div>
    </div>
  )
}

export default Footer
