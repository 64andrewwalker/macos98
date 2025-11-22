import React, { createContext, useContext, useState, type ReactNode } from 'react';
import patternBg from '../assets/pattern_bg.png';

interface DesktopContextType {
    backgroundImage: string;
    setBackgroundImage: (image: string) => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

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

    return (
        <DesktopContext.Provider value={{ backgroundImage, setBackgroundImage }}>
            {children}
        </DesktopContext.Provider>
    );
};
