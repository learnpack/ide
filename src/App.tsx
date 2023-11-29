import './App.css'
import './index.css'
import './components.css'

import Navbar from './components/server/Navbar'
import LessonContainer from './components/server/LessonContainer'
// import Sidebar from './components/server/Sidebar'
import FeedbackContainer from './components/client/FeedbackContainer'
import SocketDisconnectionModal from './components/client/SocketDisconnectionModal'
import CheckVideo from './components/client/CheckVideo'
import Chat from './components/server/Chat'
import useStore from './utils/store'

export default function Home() {
  const {showChatModal}=useStore();
  return (
    <main className="">
      {showChatModal && <Chat /> }
      <CheckVideo />
      <SocketDisconnectionModal />
      <FeedbackContainer />
      <Navbar />
      <LessonContainer />
    </main>
  )
}
