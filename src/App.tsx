import './styles/global.scss'
import Desktop from './components/os/Desktop'
import { DesktopProvider } from './contexts/DesktopContext'

function App() {
  return (
    <DesktopProvider>
      <Desktop />
    </DesktopProvider>
  )
}

export default App
