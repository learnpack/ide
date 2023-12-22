import './App.css'
import './index.css'
import './components.css'

import Navbar from './components/composites/Navbar'
import LessonContainer from './components/composites/LessonContainer'
import SocketDisconnectionModal from './components/composites/SocketDisconnectionModal'
import CheckVideo from './components/composites/CheckVideo'
import Chat from './components/composites/Chat'
import useStore from './utils/store'
import { SocketHandler } from './components/composites/SocketHandler'
import { Toaster } from 'react-hot-toast'
export default function Home() {
  const { showChatModal } = useStore();
  return (
    <main className="">
      <SocketDisconnectionModal />
      <SocketHandler />
      <Toaster />
      {showChatModal && <Chat />}
      <CheckVideo />
      <Navbar />
      <LessonContainer />
    </main>
  )
}
