import './App.css'
import './index.css'
import './components.css'

import LessonContainer from './components/sections/lesson/LessonContainer'
import { SocketHandler } from './components/composites/SocketHandler'
import { Toaster } from 'react-hot-toast'
import { Header } from './components/sections/header'
import { ModalsContainer } from './components/sections/modals'
export default function Home() {

  return (
    <main className="">
      <Toaster />
      <ModalsContainer />
      <SocketHandler />
      <Header />
      <LessonContainer />
    </main>
  )
}
