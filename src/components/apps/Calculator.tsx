import React, { useState } from 'react';
import styles from './Calculator.module.scss';

const Calculator: React.FC = () => {
    // Calculator component
    const [display, setDisplay] = useState('0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

    const inputDigit = (digit: string) => {
        if (waitingForSecondOperand) {
            setDisplay(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDot = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const clear = () => {
        setDisplay('0');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (firstOperand === null) {
            setFirstOperand(inputValue);
        } else if (operator) {
            const result = calculate(firstOperand, inputValue, operator);
            setDisplay(String(result));
            setFirstOperand(result);
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator);
    };

    const calculate = (first: number, second: number, op: string) => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '*': return first * second;
            case '/': return first / second;
            default: return second;
        }
    };

    return (
        <div className={styles.calculator}>
            <div className={styles.display} data-testid="display">{display}</div>
            <div className={styles.keypad}>
                <button onClick={() => clear()} className={styles.clear} data-testid="btn-clear">C</button>
                <button onClick={() => performOperation('/')} data-testid="btn-divide">/</button>
                <button onClick={() => performOperation('*')} data-testid="btn-multiply">*</button>
                <button onClick={() => performOperation('-')} data-testid="btn-subtract">-</button>

                <button onClick={() => inputDigit('7')} data-testid="btn-7">7</button>
                <button onClick={() => inputDigit('8')} data-testid="btn-8">8</button>
                <button onClick={() => inputDigit('9')} data-testid="btn-9">9</button>
                <button onClick={() => performOperation('+')} className={styles.plus} data-testid="btn-add">+</button>

                <button onClick={() => inputDigit('4')} data-testid="btn-4">4</button>
                <button onClick={() => inputDigit('5')} data-testid="btn-5">5</button>
                <button onClick={() => inputDigit('6')} data-testid="btn-6">6</button>

                <button onClick={() => inputDigit('1')} data-testid="btn-1">1</button>
                <button onClick={() => inputDigit('2')} data-testid="btn-2">2</button>
                <button onClick={() => inputDigit('3')} data-testid="btn-3">3</button>
                <button onClick={() => performOperation('=')} className={styles.equals} data-testid="btn-equals">=</button>

                <button onClick={() => inputDigit('0')} className={styles.zero} data-testid="btn-0">0</button>
                <button onClick={() => inputDot()} data-testid="btn-dot">.</button>
            </div>
        </div>
    );
};

export default Calculator;
