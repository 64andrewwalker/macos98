import { describe, it, expect } from 'vitest';
import { arrangeIcons } from './iconLayout';
import type { DesktopIconData } from '../hooks/useDesktopLogic';

describe('arrangeIcons', () => {
    const mockIcons: DesktopIconData[] = [
        { id: '1', label: 'Icon 1', icon: '', x: 0, y: 0, onDoubleClick: () => { } },
        { id: '2', label: 'Icon 2', icon: '', x: 0, y: 0, onDoubleClick: () => { } },
        { id: '3', label: 'Icon 3', icon: '', x: 0, y: 0, onDoubleClick: () => { } },
        { id: '4', label: 'Icon 4', icon: '', x: 0, y: 0, onDoubleClick: () => { } },
        { id: '5', label: 'Icon 5', icon: '', x: 0, y: 0, onDoubleClick: () => { } },
        { id: '6', label: 'Icon 6', icon: '', x: 0, y: 0, onDoubleClick: () => { } },
    ];

    it('arranges icons in a column', () => {
        const arranged = arrangeIcons(mockIcons, 20, 20, 100, 100, 'column', 500);

        expect(arranged[0].x).toBe(20);
        expect(arranged[0].y).toBe(20);

        expect(arranged[1].x).toBe(20);
        expect(arranged[1].y).toBe(120); // 20 + 100

        expect(arranged[2].x).toBe(20);
        expect(arranged[2].y).toBe(220);
    });

    it('wraps to next column when height is exceeded', () => {
        // height 250, start 20, gap 100.
        // 1: 20
        // 2: 120
        // 3: 220
        // 4: 320 -> exceeds 250? No, check logic.
        // Logic: currentY += gapY. if currentY > maxHeight...
        // 1: y=20. next y=120.
        // 2: y=120. next y=220.
        // 3: y=220. next y=320.
        // If maxHeight is 300. 320 > 300.
        // So 4th icon should be at new column.

        const arranged = arrangeIcons(mockIcons, 20, 20, 100, 100, 'column', 300);

        expect(arranged[0].x).toBe(20);
        expect(arranged[0].y).toBe(20);

        expect(arranged[1].x).toBe(20);
        expect(arranged[1].y).toBe(120);

        expect(arranged[2].x).toBe(20);
        expect(arranged[2].y).toBe(220);

        // 4th icon should wrap
        expect(arranged[3].x).toBe(120); // 20 + 100
        expect(arranged[3].y).toBe(20);
    });
});
