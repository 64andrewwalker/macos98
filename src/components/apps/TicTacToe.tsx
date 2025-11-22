import React, { useState } from 'react';
import styles from './TicTacToe.module.scss';

type PlayerSymbol = 'X' | 'O';
type SquareValue = PlayerSymbol | null;

const createEmptyBoard = (): SquareValue[] => Array.from({ length: 9 }, () => null);

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<SquareValue[]>(createEmptyBoard());
    const [xIsNext, setXIsNext] = useState(true);

    const calculateWinner = (squares: SquareValue[]): PlayerSymbol | null => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    const handleClick = (i: number) => {
        if (calculateWinner(board) || board[i]) return;
        const newBoard = [...board];
        newBoard[i] = xIsNext ? 'X' : 'O';
        setBoard(newBoard);
        setXIsNext(!xIsNext);
    };

    const winner = calculateWinner(board);
    const status = winner ? `Winner: ${winner}` : `Next player: ${xIsNext ? 'X' : 'O'}`;

    const resetGame = () => {
        setBoard(createEmptyBoard());
        setXIsNext(true);
    };

    return (
        <div className={styles.tictactoe}>
            <div className={styles.status}>{status}</div>
            <div className={styles.board}>
                {board.map((square, i) => (
                    <button key={i} className={styles.square} onClick={() => handleClick(i)}>
                        {square}
                    </button>
                ))}
            </div>
            <button className={styles.reset} onClick={resetGame}>New Game</button>
        </div>
    );
};

export default TicTacToe;
