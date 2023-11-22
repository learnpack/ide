import './App.css'
import './index.css'
import './components.css'

import Navbar from './components/server/Navbar'
import LessonContainer from './components/server/LessonContainer'
// import Sidebar from './components/server/Sidebar'
import FeedbackContainer from './components/client/FeedbackContainer'
import SocketDisconnectionModal from './components/client/SocketDisconnectionModal'
import CheckVideo from './components/client/CheckVideo'

export default function Home() {
  return (
    <main className="">
      <CheckVideo />
      <SocketDisconnectionModal />
      <FeedbackContainer />
      <Navbar />
      <LessonContainer />
    </main>
  )
}
