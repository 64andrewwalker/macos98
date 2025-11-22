// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Calculator from './Calculator';

afterEach(() => {
    cleanup();
});

describe('Calculator', () => {
    describe('Initial Rendering', () => {
        it('renders correctly with initial display value of 0', () => {
            render(<Calculator />);
            const display = screen.getByTestId('display');
            expect(display.textContent).toBe('0');
        });

        it('renders all calculator buttons', () => {
            render(<Calculator />);

            // Number buttons
            expect(screen.getByTestId('btn-0')).toBeInTheDocument();
            expect(screen.getByTestId('btn-1')).toBeInTheDocument();
            expect(screen.getByTestId('btn-2')).toBeInTheDocument();
            expect(screen.getByTestId('btn-3')).toBeInTheDocument();
            expect(screen.getByTestId('btn-4')).toBeInTheDocument();
            expect(screen.getByTestId('btn-5')).toBeInTheDocument();
            expect(screen.getByTestId('btn-6')).toBeInTheDocument();
            expect(screen.getByTestId('btn-7')).toBeInTheDocument();
            expect(screen.getByTestId('btn-8')).toBeInTheDocument();
            expect(screen.getByTestId('btn-9')).toBeInTheDocument();

            // Operation buttons
            expect(screen.getByTestId('btn-add')).toBeInTheDocument();
            expect(screen.getByTestId('btn-subtract')).toBeInTheDocument();
            expect(screen.getByTestId('btn-multiply')).toBeInTheDocument();
            expect(screen.getByTestId('btn-divide')).toBeInTheDocument();
            expect(screen.getByTestId('btn-equals')).toBeInTheDocument();

            // Utility buttons
            expect(screen.getByTestId('btn-clear')).toBeInTheDocument();
            expect(screen.getByTestId('btn-dot')).toBeInTheDocument();
        });
    });

    describe('Number Input', () => {
        it('inputs single digit correctly', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            expect(screen.getByTestId('display').textContent).toBe('5');
        });

        it('inputs multiple digits correctly', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-1'));
            fireEvent.click(screen.getByTestId('btn-2'));
            fireEvent.click(screen.getByTestId('btn-3'));
            expect(screen.getByTestId('display').textContent).toBe('123');
        });

        it('starts new number after operation', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-1'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-2'));
            expect(screen.getByTestId('display').textContent).toBe('2');
        });

        it('handles zero input correctly', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-0'));
            expect(screen.getByTestId('display').textContent).toBe('0');
        });

        it('handles multiple zero inputs', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-0'));
            fireEvent.click(screen.getByTestId('btn-0'));
            expect(screen.getByTestId('display').textContent).toBe('0');
        });
    });

    describe('Decimal Point Input', () => {
        it('adds decimal point to number', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-dot'));
            expect(screen.getByTestId('display').textContent).toBe('5.');
        });

        it('prevents multiple decimal points in same number', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-dot'));
            fireEvent.click(screen.getByTestId('btn-dot'));
            expect(screen.getByTestId('display').textContent).toBe('5.');
        });

        it('starts with decimal point', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-dot'));
            expect(screen.getByTestId('display').textContent).toBe('0.');
        });

        it('handles decimal point after operation', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-dot'));
            expect(screen.getByTestId('display').textContent).toBe('0.');
            fireEvent.click(screen.getByTestId('btn-2'));
            expect(screen.getByTestId('display').textContent).toBe('0.2');
        });
    });

    describe('Arithmetic Operations', () => {
        describe('Addition', () => {
            it('performs basic addition correctly', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-1'));
                fireEvent.click(screen.getByTestId('btn-add'));
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('3');
            });

            it('adds decimal numbers', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-1'));
                fireEvent.click(screen.getByTestId('btn-dot'));
                fireEvent.click(screen.getByTestId('btn-5'));
                fireEvent.click(screen.getByTestId('btn-add'));
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-dot'));
                fireEvent.click(screen.getByTestId('btn-3'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('3.8');
            });

            it('handles multiple additions', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-1'));
                fireEvent.click(screen.getByTestId('btn-add'));
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-add'));
                fireEvent.click(screen.getByTestId('btn-3'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('6');
            });
        });

        describe('Subtraction', () => {
            it('performs basic subtraction correctly', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-5'));
                fireEvent.click(screen.getByTestId('btn-subtract'));
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('3');
            });

            it('handles negative results', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-subtract'));
                fireEvent.click(screen.getByTestId('btn-5'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('-3');
            });
        });

        describe('Multiplication', () => {
            it('performs basic multiplication correctly', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-3'));
                fireEvent.click(screen.getByTestId('btn-multiply'));
                fireEvent.click(screen.getByTestId('btn-4'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('12');
            });

            it('multiplies by zero', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-5'));
                fireEvent.click(screen.getByTestId('btn-multiply'));
                fireEvent.click(screen.getByTestId('btn-0'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('0');
            });
        });

        describe('Division', () => {
            it('performs basic division correctly', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-8'));
                fireEvent.click(screen.getByTestId('btn-divide'));
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('4');
            });

            it('handles division by zero', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-5'));
                fireEvent.click(screen.getByTestId('btn-divide'));
                fireEvent.click(screen.getByTestId('btn-0'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('Infinity');
            });

            it('produces decimal results', () => {
                render(<Calculator />);
                fireEvent.click(screen.getByTestId('btn-5'));
                fireEvent.click(screen.getByTestId('btn-divide'));
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-equals'));
                expect(screen.getByTestId('display').textContent).toBe('2.5');
            });

            it('truncates long decimal results to prevent UI overflow', () => {
                render(<Calculator />);
                // 1 / 3 = 0.333333... (repeating)
                fireEvent.click(screen.getByTestId('btn-1'));
                fireEvent.click(screen.getByTestId('btn-divide'));
                fireEvent.click(screen.getByTestId('btn-3'));
                fireEvent.click(screen.getByTestId('btn-equals'));

                const display = screen.getByTestId('display').textContent || '';
                // Should be truncated to reasonable precision (e.g., max 8 decimal places)
                expect(display.length).toBeLessThanOrEqual(10); // 0.33333333 = 10 chars
                expect(display).toMatch(/^0\.3+$/); // Should start with 0.3...
            });

            it('handles division resulting in very long decimals', () => {
                render(<Calculator />);
                // 2 / 3 = 0.666666... (repeating)
                fireEvent.click(screen.getByTestId('btn-2'));
                fireEvent.click(screen.getByTestId('btn-divide'));
                fireEvent.click(screen.getByTestId('btn-3'));
                fireEvent.click(screen.getByTestId('btn-equals'));

                const display = screen.getByTestId('display').textContent || '';
                expect(display.length).toBeLessThanOrEqual(10);
                // toFixed rounds, so 0.66666666... becomes 0.66666667
                expect(display).toBe('0.66666667');
            });
        });
    });

    describe('Clear Functionality', () => {
        it('clears the display to 0', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-clear'));
            expect(screen.getByTestId('display').textContent).toBe('0');
        });

        it('clears all calculator state', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-3'));
            fireEvent.click(screen.getByTestId('btn-clear'));
            expect(screen.getByTestId('display').textContent).toBe('0');

            // Verify state is reset by performing new operation
            fireEvent.click(screen.getByTestId('btn-2'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-1'));
            fireEvent.click(screen.getByTestId('btn-equals'));
            expect(screen.getByTestId('display').textContent).toBe('3');
        });
    });

    describe('Operation Chaining', () => {
        it('chains multiple operations without equals', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-3'));
            fireEvent.click(screen.getByTestId('btn-multiply'));
            fireEvent.click(screen.getByTestId('btn-2'));
            fireEvent.click(screen.getByTestId('btn-equals'));
            expect(screen.getByTestId('display').textContent).toBe('16'); // (5+3)*2 = 16
        });

        it('changes operation before entering second operand', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-multiply'));
            fireEvent.click(screen.getByTestId('btn-2'));
            fireEvent.click(screen.getByTestId('btn-equals'));
            expect(screen.getByTestId('display').textContent).toBe('20'); // (5+5)*2 = 20
        });
    });

    describe('Edge Cases', () => {
        it('handles equals without operation', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-equals'));
            expect(screen.getByTestId('display').textContent).toBe('5');
        });

        it('handles operation without second operand', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-equals'));
            expect(screen.getByTestId('display').textContent).toBe('10'); // 5+5 = 10
        });

        it('handles very large numbers', () => {
            render(<Calculator />);
            // Input a large number
            const largeNumber = '999999999';
            largeNumber.split('').forEach(digit => {
                fireEvent.click(screen.getByTestId(`btn-${digit}`));
            });
            expect(screen.getByTestId('display').textContent).toBe(largeNumber);
        });

        it('starts with operation (implicit zero)', () => {
            render(<Calculator />);
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-equals'));
            expect(screen.getByTestId('display').textContent).toBe('5'); // 0+5 = 5
        });
    });

    describe('State Management', () => {
        it('maintains correct state through complex operations', () => {
            render(<Calculator />);

            // Perform: 10 + 5 * 2 = 30
            fireEvent.click(screen.getByTestId('btn-1'));
            fireEvent.click(screen.getByTestId('btn-0'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-5'));
            fireEvent.click(screen.getByTestId('btn-multiply'));
            fireEvent.click(screen.getByTestId('btn-2'));
            fireEvent.click(screen.getByTestId('btn-equals'));

            expect(screen.getByTestId('display').textContent).toBe('30');
        });

        it('resets state correctly after clear', () => {
            render(<Calculator />);

            // Do some operations
            fireEvent.click(screen.getByTestId('btn-1'));
            fireEvent.click(screen.getByTestId('btn-0'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-5'));

            // Clear and start fresh
            fireEvent.click(screen.getByTestId('btn-clear'));
            fireEvent.click(screen.getByTestId('btn-2'));
            fireEvent.click(screen.getByTestId('btn-add'));
            fireEvent.click(screen.getByTestId('btn-3'));
            fireEvent.click(screen.getByTestId('btn-equals'));

            expect(screen.getByTestId('display').textContent).toBe('5');
        });
    });
});
