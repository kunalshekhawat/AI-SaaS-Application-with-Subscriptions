import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useUser, SignIn } from '@clerk/clerk-react'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const { user, isLoaded } = useUser()

  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className='flex items-center justify-center h-screen bg-white'>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? (
    <div className='flex flex-col items-start justify-start h-screen'>
      <nav className='w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200'>
        <img className='cursor-pointer w-32 sm:w-44' src={assets.logo} alt="" onClick={()=> navigate('/')}/>
        {
          sidebar ? <X onClick={()=> setSidebar(false)} className='w-6 h-6 text-gray-600 sm:hidden'/> : <Menu onClick={()=> setSidebar(true)} className='w-6 h-6 text-gray-600 sm:hidden'/>
        }
      </nav>
      <div className='flex-1 w-full flex h-[calc(100vh-64px)]'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar}/>
        <div className='flex-1 bg-[#F4F7FB]'>
          <Outlet/>
        </div>
      </div>
    </div>
  ) : (
    <div className='flex items-center justify-center h-screen bg-white'>
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <img className='mx-auto w-32 sm:w-44 mb-4' src={assets.logo} alt="Logo" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Quick.ai</h1>
          <p className="text-gray-600">Sign in to access your AI dashboard</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
          redirectUrl="/ai"
          afterSignInUrl="/ai"
        />
      </div>
    </div>
  )
}

export default Layout
