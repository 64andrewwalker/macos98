// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Calculator from './Calculator';

afterEach(() => {
    cleanup();
});

describe('Calculator', () => {
    it('renders correctly', () => {
        render(<Calculator />);
        const displays = screen.getAllByTestId('display');
        expect(displays[0].textContent).toBe('0');
    });

    it('performs addition correctly', () => {
        render(<Calculator />);

        fireEvent.click(screen.getAllByTestId('btn-1')[0]);
        fireEvent.click(screen.getAllByTestId('btn-add')[0]);
        fireEvent.click(screen.getAllByTestId('btn-2')[0]);
        fireEvent.click(screen.getAllByTestId('btn-equals')[0]);

        const displays = screen.getAllByTestId('display');
        expect(displays[0].textContent).toBe('3');
    });

    it('clears the display', () => {
        render(<Calculator />);

        fireEvent.click(screen.getAllByTestId('btn-5')[0]);
        fireEvent.click(screen.getAllByTestId('btn-clear')[0]);

        const displays = screen.getAllByTestId('display');
        expect(displays[0].textContent).toBe('0');
    });
});
