import './App.css'
import './index.css'

import Navbar from './components/server/Navbar'
import LessonContainer from './components/server/LessonContainer'
// import Sidebar from './components/server/Sidebar'
import FeedbackContainer from './components/client/FeedbackContainer'
import SocketDisconnectionModal from './components/client/SocketDisconnectionModal'
export default function Home() {
  return (
    <main className="">
      <SocketDisconnectionModal />
      <FeedbackContainer />
      <Navbar />
      <LessonContainer />
    </main>
  )
}
