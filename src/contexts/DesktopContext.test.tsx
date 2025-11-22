// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { DesktopProvider, useDesktop } from './DesktopContext.tsx';
import patternBg from '../assets/pattern_bg.png';

afterEach(() => {
    cleanup();
});

// Test component to access context
const TestComponent = () => {
    const { backgroundImage, setBackgroundImage, backgroundMode, setBackgroundMode } = useDesktop();
    return (
        <div>
            <div data-testid="background">{backgroundImage}</div>
            <div data-testid="mode">{backgroundMode}</div>
            <button onClick={() => setBackgroundImage('test-bg.png')}>
                Change Background
            </button>
            <button onClick={() => setBackgroundMode('tile')}>
                Change Mode
            </button>
        </div>
    );
};

describe('DesktopContext', () => {
    describe('Provider', () => {
        it('renders children correctly', () => {
            render(
                <DesktopProvider>
                    <div>Test Child</div>
                </DesktopProvider>
            );
            expect(screen.getByText('Test Child')).toBeInTheDocument();
        });

        it('provides default background value', () => {
            render(
                <DesktopProvider>
                    <TestComponent />
                </DesktopProvider>
            );
            expect(screen.getByTestId('background')).toHaveTextContent(patternBg);
            expect(screen.getByTestId('mode')).toHaveTextContent('fill');
        });

        it('allows background state to be updated', () => {
            render(
                <DesktopProvider>
                    <TestComponent />
                </DesktopProvider>
            );

            const background = screen.getByTestId('background');
            expect(background).toHaveTextContent(patternBg);

            const button = screen.getByText('Change Background');
            act(() => {
                button.click();
            });

            expect(background).toHaveTextContent('test-bg.png');
        });

        it('allows background mode to be updated', () => {
            render(
                <DesktopProvider>
                    <TestComponent />
                </DesktopProvider>
            );

            const mode = screen.getByTestId('mode');
            expect(mode).toHaveTextContent('fill');

            const button = screen.getByText('Change Mode');
            act(() => {
                button.click();
            });

            expect(mode).toHaveTextContent('tile');
        });
    });

    describe('Consumer', () => {
        it('throws error when used outside provider', () => {
            // Suppress console.error for this test
            const originalError = console.error;
            console.error = () => { };

            expect(() => {
                render(<TestComponent />);
            }).toThrow('useDesktop must be used within a DesktopProvider');

            console.error = originalError;
        });
    });
});
