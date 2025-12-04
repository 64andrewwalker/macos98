import './styles/global.scss'
import Desktop from './components/os/Desktop'
import { DesktopProvider } from './contexts/DesktopContext'
import { ShellProvider } from './ui-shell'
import { SystemProvider } from './system'

function App() {
  return (
    <SystemProvider>
      <ShellProvider>
        <DesktopProvider>
          <Desktop />
        </DesktopProvider>
      </ShellProvider>
    </SystemProvider>
  )
}

export default App
