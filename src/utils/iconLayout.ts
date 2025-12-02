import type { DesktopIconData } from '../hooks/useDesktopLogic';

export const arrangeIcons = (
    icons: DesktopIconData[],
    startX: number = 20,
    startY: number = 40,
    gapY: number = 90, // Vertical gap between icons
    gapX: number = 100, // Horizontal gap between columns
    direction: 'column' | 'row' = 'column',
    maxHeight: number = 600 // Approximate desktop height to wrap columns
): DesktopIconData[] => {
    // Sort icons? Maybe by type then name? Or just keep current order but fix positions?
    // Let's keep current order for now, or maybe sort by ID/Label if desired.
    // For "Clean Up", usually it just snaps to grid.
    // But if we want to "Arrange", we might sort.
    // Let's just re-position them in their current array order to a grid.

    // We'll place them in columns starting from left.

    let currentX = startX;
    let currentY = startY;

    return icons.map((icon) => {
        const newIcon = {
            ...icon,
            x: currentX,
            y: currentY
        };

        if (direction === 'column') {
            currentY += gapY;
            if (currentY > maxHeight) {
                currentY = startY;
                currentX += gapX;
            }
        } else {
            currentX += gapX;
            // Row logic if needed
        }

        return newIcon;
    });
};
