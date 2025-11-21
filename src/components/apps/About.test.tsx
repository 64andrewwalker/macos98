// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import About from './About';

afterEach(() => {
    cleanup();
});

describe('About', () => {
    describe('Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<About />)).not.toThrow();
        });

        it('renders all expected content', () => {
            render(<About />);
            // Component renders successfully if all text elements are found
            expect(screen.getByText('Macintosh System 7')).toBeInTheDocument();
            expect(screen.getByText('MacOS 90s Simulation')).toBeInTheDocument();
            expect(screen.getByText('Built with React & Vite')).toBeInTheDocument();
        });
    });

    describe('Logo Display', () => {
        it('renders the Apple logo image', () => {
            render(<About />);
            const logoImg = screen.getByAltText('Apple Logo');
            expect(logoImg).toBeInTheDocument();
        });

        it('uses the correct logo source', () => {
            render(<About />);
            const logoImg = screen.getByAltText('Apple Logo') as HTMLImageElement;
            expect(logoImg.src).toContain('apple_logo');
        });

        it('logo image has correct attributes', () => {
            render(<About />);
            const logoImg = screen.getByAltText('Apple Logo') as HTMLImageElement;
            expect(logoImg).toBeInTheDocument();
            expect(logoImg.alt).toBe('Apple Logo');
        });
    });

    describe('Content Display', () => {
        it('displays the title "Macintosh System 7"', () => {
            render(<About />);
            const title = screen.getByText('Macintosh System 7');
            expect(title).toBeInTheDocument();
            expect(title.tagName).toBe('H2');
        });

        it('displays the subtitle', () => {
            render(<About />);
            expect(screen.getByText('MacOS 90s Simulation')).toBeInTheDocument();
        });

        it('displays the technology info', () => {
            render(<About />);
            expect(screen.getByText('Built with React & Vite')).toBeInTheDocument();
        });

        it('displays the copyright notice', () => {
            render(<About />);
            const copyright = screen.getByText('© 2025 Antigravity');
            expect(copyright).toBeInTheDocument();
        });
    });

    describe('Memory Information', () => {
        it('displays built-in memory', () => {
            render(<About />);
            expect(screen.getByText('Built-in Memory: 128 MB')).toBeInTheDocument();
        });

        it('displays total memory', () => {
            render(<About />);
            expect(screen.getByText('Total Memory: 128 MB')).toBeInTheDocument();
        });

        it('memory information appears after other content', () => {
            render(<About />);
            const allParagraphs = screen.getAllByText(/^.*MB$/);
            expect(allParagraphs).toHaveLength(2);
            expect(allParagraphs[0]).toHaveTextContent('Built-in Memory: 128 MB');
            expect(allParagraphs[1]).toHaveTextContent('Total Memory: 128 MB');
        });
    });

    describe('Component Structure', () => {
        it('has proper heading hierarchy', () => {
            render(<About />);
            const heading = screen.getByRole('heading', { level: 2 });
            expect(heading).toHaveTextContent('Macintosh System 7');
        });

        it('contains all expected text content', () => {
            render(<About />);
            const component = screen.getByText('Macintosh System 7').closest('div');

            expect(component).toHaveTextContent('Macintosh System 7');
            expect(component).toHaveTextContent('MacOS 90s Simulation');
            expect(component).toHaveTextContent('Built with React & Vite');
            expect(component).toHaveTextContent('© 2025 Antigravity');
            expect(component).toHaveTextContent('Built-in Memory: 128 MB');
            expect(component).toHaveTextContent('Total Memory: 128 MB');
        });

        it('logo and info sections are properly positioned', () => {
            render(<About />);
            const title = screen.getByText('Macintosh System 7');
            const logo = screen.getByAltText('Apple Logo');

            // Logo should be in its own container, info should contain the title
            expect(title.parentElement?.className).toContain('info');
            expect(logo.parentElement?.className).toContain('logo');
        });
    });

    describe('Text Content Verification', () => {
        it('has exactly the expected text elements', () => {
            render(<About />);

            // Check all paragraph-level content
            const paragraphs = screen.getAllByText(/^.*$/).filter(el =>
                el.tagName === 'P' || el.tagName === 'H2'
            );

            const textContents = paragraphs.map(p => p.textContent);
            expect(textContents).toEqual(
                expect.arrayContaining([
                    'Macintosh System 7',
                    'MacOS 90s Simulation',
                    'Built with React & Vite',
                    '© 2025 Antigravity',
                    'Built-in Memory: 128 MB',
                    'Total Memory: 128 MB'
                ])
            );
        });

        it('copyright appears at the end', () => {
            render(<About />);
            const copyright = screen.getByText('© 2025 Antigravity');

            // Copyright should be the last text element before memory info
            const parent = copyright.parentElement;
            const siblings = Array.from(parent?.children || []);
            const copyrightIndex = siblings.indexOf(copyright);

            expect(copyrightIndex).toBeGreaterThan(-1);
        });
    });

    describe('Accessibility', () => {
        it('image has descriptive alt text', () => {
            render(<About />);
            const logoImg = screen.getByAltText('Apple Logo');
            expect(logoImg).toBeInTheDocument();
            expect(logoImg.getAttribute('alt')).toBe('Apple Logo');
        });

        it('content is semantically structured', () => {
            render(<About />);

            // Should have a heading
            expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

            // Should have an image with alt text
            expect(screen.getByRole('img', { name: 'Apple Logo' })).toBeInTheDocument();
        });

        it('all text content is visible', () => {
            render(<About />);

            expect(screen.getByText('Macintosh System 7')).toBeVisible();
            expect(screen.getByText('MacOS 90s Simulation')).toBeVisible();
            expect(screen.getByText('Built with React & Vite')).toBeVisible();
            expect(screen.getByText('© 2025 Antigravity')).toBeVisible();
            expect(screen.getByText('Built-in Memory: 128 MB')).toBeVisible();
            expect(screen.getByText('Total Memory: 128 MB')).toBeVisible();
        });
    });
});
