import './App.css'
import './index.css'
import './components.css'

import Navbar from './components/server/Navbar'
import LessonContainer from './components/server/LessonContainer'
import SocketDisconnectionModal from './components/client/SocketDisconnectionModal'
import CheckVideo from './components/client/CheckVideo'
import Chat from './components/server/Chat'
import useStore from './utils/store'
import { SocketHandler } from './components/client/SocketHandler'
export default function Home() {
  const { showChatModal } = useStore();
  return (
    <main className="">
      <SocketHandler />
      {showChatModal && <Chat />}
      <CheckVideo />
      <SocketDisconnectionModal />
      <Navbar />
      <LessonContainer />
    </main>
  )
}
