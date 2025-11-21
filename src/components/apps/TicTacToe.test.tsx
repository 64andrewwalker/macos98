// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TicTacToe from './TicTacToe';

afterEach(() => {
    cleanup();
});

describe('TicTacToe', () => {
    describe('Initial Rendering', () => {
        it('renders the game board with 9 squares', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');
            expect(squares).toHaveLength(10); // 9 squares + 1 reset button
        });

        it('renders empty board initially', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');
            // Check first 9 buttons (squares) are empty
            squares.slice(0, 9).forEach(square => {
                expect(square.textContent).toBe('');
            });
        });

        it('shows correct initial status', () => {
            render(<TicTacToe />);
            expect(screen.getByText('Next player: X')).toBeInTheDocument();
        });

        it('renders reset button', () => {
            render(<TicTacToe />);
            expect(screen.getByText('New Game')).toBeInTheDocument();
        });
    });

    describe('Game Play', () => {
        it('allows X to make first move', () => {
            render(<TicTacToe />);
            const firstSquare = screen.getAllByRole('button')[0];
            fireEvent.click(firstSquare);
            expect(firstSquare.textContent).toBe('X');
        });

        it('alternates between X and O', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            fireEvent.click(squares[0]); // X
            expect(squares[0].textContent).toBe('X');
            expect(screen.getByText('Next player: O')).toBeInTheDocument();

            fireEvent.click(squares[1]); // O
            expect(squares[1].textContent).toBe('O');
            expect(screen.getByText('Next player: X')).toBeInTheDocument();
        });

        it('prevents clicking on occupied squares', () => {
            render(<TicTacToe />);
            const firstSquare = screen.getAllByRole('button')[0];

            fireEvent.click(firstSquare);
            expect(firstSquare.textContent).toBe('X');

            // Click again - should not change
            fireEvent.click(firstSquare);
            expect(firstSquare.textContent).toBe('X');
            expect(screen.getByText('Next player: O')).toBeInTheDocument();
        });
    });

    describe('Winner Detection', () => {
        it('detects horizontal win (top row)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes top row
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[3]); // O
            fireEvent.click(squares[1]); // X
            fireEvent.click(squares[4]); // O
            fireEvent.click(squares[2]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('detects horizontal win (middle row)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes middle row
            fireEvent.click(squares[3]); // X
            fireEvent.click(squares[0]); // O
            fireEvent.click(squares[4]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[5]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('detects horizontal win (bottom row)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes bottom row
            fireEvent.click(squares[6]); // X
            fireEvent.click(squares[0]); // O
            fireEvent.click(squares[7]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[8]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('detects vertical win (left column)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes left column
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[3]); // X
            fireEvent.click(squares[2]); // O
            fireEvent.click(squares[6]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('detects vertical win (middle column)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes middle column
            fireEvent.click(squares[1]); // X
            fireEvent.click(squares[0]); // O
            fireEvent.click(squares[4]); // X
            fireEvent.click(squares[2]); // O
            fireEvent.click(squares[7]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('detects vertical win (right column)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes right column
            fireEvent.click(squares[2]); // X
            fireEvent.click(squares[0]); // O
            fireEvent.click(squares[5]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[8]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('detects diagonal win (top-left to bottom-right)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes main diagonal
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[4]); // X
            fireEvent.click(squares[2]); // O
            fireEvent.click(squares[8]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('detects diagonal win (top-right to bottom-left)', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X takes anti-diagonal
            fireEvent.click(squares[2]); // X
            fireEvent.click(squares[0]); // O
            fireEvent.click(squares[4]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[6]); // X wins

            expect(screen.getByText('Winner: X')).toBeInTheDocument();
        });

        it('allows O to win', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // O wins
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[3]); // O
            fireEvent.click(squares[1]); // X
            fireEvent.click(squares[4]); // O
            fireEvent.click(squares[6]); // X
            fireEvent.click(squares[5]); // O wins

            expect(screen.getByText('Winner: O')).toBeInTheDocument();
        });
    });

    describe('Game End Conditions', () => {
        it('prevents moves after game ends with win', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // X wins top row
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[3]); // O
            fireEvent.click(squares[1]); // X
            fireEvent.click(squares[4]); // O
            fireEvent.click(squares[2]); // X wins

            // Try to make another move - should not work
            fireEvent.click(squares[5]);
            expect(squares[5].textContent).toBe('');
        });

        it('game status updates correctly during play', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            expect(screen.getByText('Next player: X')).toBeInTheDocument();

            fireEvent.click(squares[0]); // X
            expect(screen.getByText('Next player: O')).toBeInTheDocument();

            fireEvent.click(squares[1]); // O
            expect(screen.getByText('Next player: X')).toBeInTheDocument();
        });

        it('continues game when no winner and spaces remain', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // Make a few moves without winner
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[2]); // X

            expect(screen.getByText('Next player: O')).toBeInTheDocument();

            // Can still make moves
            fireEvent.click(squares[3]);
            expect(squares[3].textContent).toBe('O');
        });
    });

    describe('Reset Functionality', () => {
        it('resets board to empty state', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');
            const resetButton = screen.getByText('New Game');

            // Make some moves
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[2]); // X

            // Reset game
            fireEvent.click(resetButton);

            // All squares should be empty
            squares.slice(0, 9).forEach(square => {
                expect(square.textContent).toBe('');
            });
        });

        it('resets status to X next player', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');
            const resetButton = screen.getByText('New Game');

            // Make a move
            fireEvent.click(squares[0]); // X

            // Reset game
            fireEvent.click(resetButton);

            expect(screen.getByText('Next player: X')).toBeInTheDocument();
        });

        it('allows playing again after reset', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');
            const resetButton = screen.getByText('New Game');

            // Play and win
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[3]); // O
            fireEvent.click(squares[1]); // X
            fireEvent.click(squares[4]); // O
            fireEvent.click(squares[2]); // X wins

            // Reset and play again
            fireEvent.click(resetButton);

            // Should be able to make moves again
            fireEvent.click(squares[0]);
            expect(squares[0].textContent).toBe('X');
            expect(screen.getByText('Next player: O')).toBeInTheDocument();
        });

        it('resets from draw position', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');
            const resetButton = screen.getByText('New Game');

            // Fill board for draw
            fireEvent.click(squares[0]); // X
            fireEvent.click(squares[1]); // O
            fireEvent.click(squares[2]); // X
            fireEvent.click(squares[3]); // O
            fireEvent.click(squares[4]); // X
            fireEvent.click(squares[5]); // O
            fireEvent.click(squares[6]); // X
            fireEvent.click(squares[7]); // O
            fireEvent.click(squares[8]); // X

            // Reset
            fireEvent.click(resetButton);

            // Should be back to initial state
            expect(screen.getByText('Next player: X')).toBeInTheDocument();
            squares.slice(0, 9).forEach(square => {
                expect(square.textContent).toBe('');
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles rapid clicking', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');

            // Click same square multiple times quickly
            fireEvent.click(squares[0]);
            fireEvent.click(squares[0]);
            fireEvent.click(squares[0]);

            expect(squares[0].textContent).toBe('X');
            expect(screen.getByText('Next player: O')).toBeInTheDocument();
        });

        it('handles clicking reset multiple times', () => {
            render(<TicTacToe />);
            const resetButton = screen.getByText('New Game');

            fireEvent.click(resetButton);
            fireEvent.click(resetButton);
            fireEvent.click(resetButton);

            expect(screen.getByText('Next player: X')).toBeInTheDocument();
        });

        it('handles clicking squares after reset', () => {
            render(<TicTacToe />);
            const squares = screen.getAllByRole('button');
            const resetButton = screen.getByText('New Game');

            fireEvent.click(squares[0]);
            fireEvent.click(resetButton);
            fireEvent.click(squares[0]);

            expect(squares[0].textContent).toBe('X');
        });
    });
});
