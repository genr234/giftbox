'use client';

import { useState } from 'react';
import VisualNovel, { Scene } from '@/app/components/VisualNovel';
import { useVisualNovel } from '@/app/hooks/useVisualNovel';

const gameScenes: Scene[] = [
    {
        id: 'scene1',
        type: 'dialogue',
        background: 'backgrounds/bedroom_day.png',
        transition: 'fade',
        dialogue: {
            text: 'This is the first scene. Click to continue.',
        }
    },
    {
        id: 'scene2',
        type: 'dialogue',
        background: 'backgrounds/bedroom_day.png',
        transition: 'fade',
        dialogue: {
            text: 'This is the second scene. Click to continue.',
        }
    },
];

export default function GamePage() {
    const [gameEnded, setGameEnded] = useState(false);

    const {
        currentScene,
        allBackgrounds,
        handleAdvance,
        handleHotspotClick,
        restart,
    } = useVisualNovel({
        scenes: gameScenes,
        onGameEnd: () => setGameEnded(true),
    });

    if (gameEnded) {
        return (
            <></>
        );
    }

    return (
        <VisualNovel
            scene={currentScene}
            allBackgrounds={allBackgrounds}
            onAdvance={handleAdvance}
            onHotspotClick={handleHotspotClick}
            textSpeed={35}
        />
    );
}