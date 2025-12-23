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
    {
        id: 'scene3',
        type: 'exploration',
        background: 'backgrounds/bedroom_day.png',
        hint: 'Look around...',
        hotspots: [
            {
                "id": "hotspot-1766358127772",
                "x": 35.00979820291223,
                "y": 7.600000000000001,
                "width": 12.7,
                "height": 33.6,
                "hoverHint": "look outside...",
                "onClickResult": "bedroom_window"
            },
            {
                "id": "hotspot-1766358166337",
                "x": 78.3,
                "y": 10.5,
                "width": 20.2,
                "height": 85.51784250557579,
                "hoverHint": "check the plant...",
                "onClickResult": "bedroom_plant"
            },
            {
                "id": "hotspot-1766358211027",
                "x": 18.00733417683515,
                "y": 58.734630854572146,
                "width": 16.030537625184966,
                "height": 18.934405917001868,
                "hoverHint": "look at your desk...",
                "onClickResult": "bedroom_desk"
            },
            {
                "id": "hotspot-1766359290050",
                "x": 7.247110291437027,
                "y": 21.8,
                "width": 14.052889708562974,
                "height": 42.2,
                "hoverHint": "look inside the mirror...",
                "onClickResult": "bedroom_mirror"
            },
            {
                "id": "hotspot-1766358308559",
                "x": 59.5,
                "y": 24.799999999999997,
                "width": 13.1,
                "height": 29.054629329571668,
                "hoverHint": "look at your clothes...",
                "onClickResult": "bedroom_clothes"
            },
            {
                "id": "hotspot-1766358326078",
                "x": 35.51181617378997,
                "y": 54.440229512571726,
                "width": 30.69692908151231,
                "height": 22.059770487428274,
                "hoverHint": "Click to interact",
                "onClickResult": "bedroom_bed"
            }
        ],
    },
    {
        id: 'scene4',
        type: 'dialogue',
        background: 'backgrounds/bedroom_day.png',
        transition: 'fade',
        dialogue: {
            text: 'You clicked on the desk. It is very messy.',
        }
    },
    {
        id: 'scene5',
        type: 'dialogue',
        background: 'backgrounds/bedroom_day.png',
        transition: 'fade',
        dialogue: {
            text: 'You clicked on the window. It is a sunny day outside.',
        }
    }
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