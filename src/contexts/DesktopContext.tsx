import React, { createContext, useContext, useState, type ReactNode } from 'react';
import patternBg from '../assets/pattern_bg.png';

export type BackgroundMode = 'fill' | 'fit' | 'tile';

interface DesktopContextType {
    backgroundImage: string;
    setBackgroundImage: (image: string) => void;
    backgroundMode: BackgroundMode;
    setBackgroundMode: (mode: BackgroundMode) => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useDesktop = (): DesktopContextType => {
    const context = useContext(DesktopContext);
    if (!context) {
        throw new Error('useDesktop must be used within a DesktopProvider');
    }
    return context;
};

interface DesktopProviderProps {
    children: ReactNode;
}

export const DesktopProvider: React.FC<DesktopProviderProps> = ({ children }) => {
    const [backgroundImage, setBackgroundImage] = useState<string>(patternBg);
    const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('fill');

    return (
        <DesktopContext.Provider value={{
            backgroundImage,
            setBackgroundImage,
            backgroundMode,
            setBackgroundMode
        }}>
            {children}
        </DesktopContext.Provider>
    );
};
