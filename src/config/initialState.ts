import hdIcon from '../assets/hd_icon.png';
import trashIcon from '../assets/trash_icon.png';
import folderIcon from '../assets/folder_icon.png';
import calcIcon from '../assets/calculator.png';
import gameIcon from '../assets/joystick.png';

export interface InitialFileItem {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'app' | 'system';
    icon: string;
    content?: string;
    children?: InitialFileItem[];
}

export interface InitialIconData {
    id: string;
    label: string;
    icon: string;
    type: 'folder' | 'file' | 'app' | 'system';
    children?: InitialFileItem[];
    content?: string;
}

export const initialIcons: InitialIconData[] = [
    {
        id: 'hd',
        label: 'Macintosh HD',
        icon: hdIcon,
        type: 'system'
    },
    {
        id: 'docs',
        label: 'Documents',
        icon: folderIcon,
        type: 'folder',
        children: [
            { id: 'file_readme', name: 'README.txt', type: 'file', icon: folderIcon, content: 'Welcome to macOS 90s!\n\nThis is a retro simulation of classic Mac OS.\n\nEnjoy!' },
            { id: 'file_notes', name: 'Notes.txt', type: 'file', icon: folderIcon, content: 'My notes...' },
            {
                id: 'folder_work', name: 'Work', type: 'folder', icon: folderIcon, children: [
                    { id: 'file_project', name: 'Project.txt', type: 'file', icon: folderIcon, content: 'Project details here.' }
                ]
            }
        ]
    },
    {
        id: 'calc',
        label: 'Calculator',
        icon: calcIcon,
        type: 'app'
    },
    {
        id: 'game',
        label: 'TicTacToe',
        icon: gameIcon,
        type: 'app'
    },
    {
        id: 'trash',
        label: 'Trash',
        icon: trashIcon,
        type: 'system'
    }
];
