/**
 * About View Component
 */

import React from 'react'
import styles from '../../components/apps/About.module.scss'
import appleLogo from '../../assets/apple_logo.png'

export const AboutView: React.FC = () => {
  return (
    <div className={styles.about}>
      <div className={styles.logo}>
        <img src={appleLogo} alt="Apple Logo" />
      </div>
      <div className={styles.info}>
        <h2>Macintosh System 7</h2>
        <p>MacOS 90s Simulation</p>
        <p>Built with React & Vite</p>
        <p className={styles.copyright}>© 2025 Antigravity</p>
        <div className={styles.memory}>
          <p>Built-in Memory: 128 MB</p>
          <p>Total Memory: 128 MB</p>
        </div>
      </div>
    </div>
  )
}

