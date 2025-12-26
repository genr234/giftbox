'use client';

import { useState } from 'react';
import VisualNovel, { Scene } from '@/components/VisualNovel';
import { useVisualNovel } from '@/app/hooks/useVisualNovel';

// Starting scene: wake-up

const gameScenes: Scene[] = [
    {
        "id": "wake-up",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "dialogue": {
            "text": "*yawns*",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "wake-up-1"
    },
    {
        "id": "wake-up-1",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "dialogue": {
            "text": "did i oversleep again??",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "exploration-1741"
    },
    {
        "id": "exploration-1741",
        "type": "exploration",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "hint": "Look around...",
        "hotspots": [
            {
                "id": "clothes",
                "x": 58.76416138276511,
                "y": 24.2,
                "width": 13.8,
                "height": 27.3,
                "hoverHint": "click to interact",
                "onClickResult": "clothes"
            },
            {
                "id": "hotspot-5439",
                "x": 34.7,
                "y": 7.199999999999999,
                "width": 13.1,
                "height": 34.4,
                "hoverHint": "click to interact",
                "onClickResult": "dialogue-9842"
            },
            {
                "id": "hotspot-0046",
                "x": 33.4205431391856,
                "y": 54.8,
                "width": 31.079456860814403,
                "height": 19.93750466649975,
                "hoverHint": "click to interact",
                "onClickResult": "dialogue-9532"
            }
        ]
    },
    {
        "id": "clothes",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "dialogue": {
            "text": "perfectly ironed! nice!",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "exploration-1741"
    },
    {
        "id": "dialogue-9842",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "dialogue": {
            "text": "it's a really nice day!",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "exploration-1741"
    },
    {
        "id": "dialogue-9532",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "dialogue": {
            "text": "i wish i could just go back to sleep...",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "dialogue-1655"
    },
    {
        "id": "dialogue-1655",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "dialogue": {
            "text": "patricia! there's a letter for you!",
            "speaker": "mom",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "dialogue-1038"
    },
    {
        "id": "dialogue-1038",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fade",
        "dialogue": {
            "text": "a letter? i wasn't expecting anything...",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "dialogue-5794"
    },
    {
        "id": "exploration-9594",
        "type": "exploration",
        "background": "/backgrounds/dining_room.png",
        "transition": "fade",
        "hint": "there's something on the table...",
        "hotspots": [
            {
                "id": "hotspot-2787",
                "x": 56.65064693682213,
                "y": 72.9,
                "width": 9.14935306317787,
                "height": 12.6,
                "hoverHint": "click to interact",
                "showLetter": true,
                "onClickResult": "dialogue-9210"
            }
        ]
    },
    {
        "id": "dialogue-5794",
        "type": "dialogue",
        "background": "/backgrounds/bedroom_day.png",
        "transition": "fadeBlack",
        "dialogue": {
            "text": "let's check it out...",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "exploration-9594"
    },
    {
        "id": "dialogue-9210",
        "type": "dialogue",
        "background": "/backgrounds/dining_room.png",
        "transition": "fade",
        "dialogue": {
            "text": "grandpa's shop?!?! i haven't been there in so long...",
            "speaker": "",
            "speakerColor": "#fcd34d"
        },
        "nextSceneId": "dialogue-5593"
    },
    {
        "id": "dialogue-5593",
        "type": "dialogue",
        "background": "/backgrounds/dining_room.png",
        "transition": "fade",
        "dialogue": {
            "text": "i better get started...",
            "speaker": "",
            "speakerColor": "#fcd34d"
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