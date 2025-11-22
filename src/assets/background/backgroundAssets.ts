// Import all background images
import apexLegendsBg from './apex_legends_bg.jpeg';
import arcadePatternBg from './arcade_pattern_bg.jpeg';
import bananaArcadeBg from './banana_arcade_bg.jpeg';
import bananaMeadowBg from './banana_meadow_bg.jpeg';
import bananaNavyBg from './banana_navy_bg.jpeg';
import bananaPastelBg from './banana_pastel_bg.jpeg';
import nanoBananaRunesBg from './nano_banana_runes_bg.jpeg';
import overwatchIconsBg from './overwatch_icons_bg.jpeg';
import techIconsSpaceBg from './tech_icons_space_bg.jpeg';
import zeldaItemsBg from './zelda_items_bg.jpeg';

export interface BackgroundAsset {
    id: string;
    name: string;
    image: string;
}

export const backgroundAssets: BackgroundAsset[] = [
    { id: 'apex_legends', name: 'Apex Legends', image: apexLegendsBg },
    { id: 'arcade_pattern', name: 'Arcade Pattern', image: arcadePatternBg },
    { id: 'banana_arcade', name: 'Banana Arcade', image: bananaArcadeBg },
    { id: 'banana_meadow', name: 'Banana Meadow', image: bananaMeadowBg },
    { id: 'banana_navy', name: 'Banana Navy', image: bananaNavyBg },
    { id: 'banana_pastel', name: 'Banana Pastel', image: bananaPastelBg },
    { id: 'nano_banana_runes', name: 'Nano Banana Runes', image: nanoBananaRunesBg },
    { id: 'overwatch_icons', name: 'Overwatch Icons', image: overwatchIconsBg },
    { id: 'tech_icons_space', name: 'Tech Icons Space', image: techIconsSpaceBg },
    { id: 'zelda_items', name: 'Zelda Items', image: zeldaItemsBg },
];
