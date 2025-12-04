import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import patternBg from '../assets/pattern_bg.png';

export type BackgroundMode = 'fill' | 'fit' | 'tile';

const WALLPAPER_STORAGE_KEY = 'macos98-wallpaper';

interface WallpaperSettings {
    image: string;
    mode: BackgroundMode;
}

interface DesktopContextType {
    backgroundImage: string;
    setBackgroundImage: (image: string) => void;
    backgroundMode: BackgroundMode;
    setBackgroundMode: (mode: BackgroundMode) => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

// Load wallpaper from localStorage
function loadWallpaperSettings(): WallpaperSettings | null {
    try {
        const json = localStorage.getItem(WALLPAPER_STORAGE_KEY);
        if (!json) return null;
        const parsed = JSON.parse(json);
        if (typeof parsed.image === 'string' && ['fill', 'fit', 'tile'].includes(parsed.mode)) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

// Save wallpaper to localStorage
function saveWallpaperSettings(settings: WallpaperSettings): void {
    try {
        localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save wallpaper settings:', e);
    }
}

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
    // Load saved settings or use defaults - use lazy initialization to ensure it only runs once
    const [backgroundImage, setBackgroundImageState] = useState<string>(() => {
        const saved = loadWallpaperSettings();
        return saved?.image ?? patternBg;
    });
    const [backgroundMode, setBackgroundModeState] = useState<BackgroundMode>(() => {
        const saved = loadWallpaperSettings();
        return saved?.mode ?? 'fill';
    });

    // Wrap setters to auto-save
    const setBackgroundImage = useCallback((image: string) => {
        setBackgroundImageState(image);
        // Use functional update to ensure we save with the new image
        setBackgroundModeState(prevMode => {
            saveWallpaperSettings({ image, mode: prevMode });
            return prevMode;
        });
    }, []);

    const setBackgroundMode = useCallback((mode: BackgroundMode) => {
        setBackgroundModeState(mode);
        // Use functional update to ensure we save with the new mode
        setBackgroundImageState(prevImage => {
            saveWallpaperSettings({ image: prevImage, mode });
            return prevImage;
        });
    }, []);

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
