'use client';

import { useState, useCallback, useMemo } from 'react';
import { Scene } from '@/app/components/VisualNovel';

interface UseVisualNovelOptions {
    scenes: Scene[];
    onGameEnd?: () => void;
    onSceneChange?: (scene: Scene) => void;
}

export function useVisualNovel({ scenes, onGameEnd, onSceneChange }: UseVisualNovelOptions) {
    const [currentSceneId, setCurrentSceneId] = useState(scenes[0]?.id);
    const [gameState, setGameState] = useState<Record<string, any>>({});
    const [history, setHistory] = useState<string[]>([]);

    const allBackgrounds = useMemo(() => {
        const bgs = new Set<string>();
        scenes.forEach(scene => bgs.add(scene.background));
        return Array.from(bgs);
    }, [scenes]);

    const currentScene = scenes.find(s => s.id === currentSceneId) || scenes[0];

    const goToScene = useCallback((sceneId: string) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (scene) {
            setHistory(prev => [...prev, currentSceneId]);
            setCurrentSceneId(sceneId);
            onSceneChange?.(scene);
        }
    }, [scenes, currentSceneId, onSceneChange]);

    const handleAdvance = useCallback((nextSceneId?: string) => {
        if (nextSceneId) {
            goToScene(nextSceneId);
        } else {
            const currentIndex = scenes.findIndex(s => s.id === currentSceneId);
            if (currentIndex < scenes.length - 1) {
                goToScene(scenes[currentIndex + 1].id);
            } else {
                onGameEnd?.();
            }
        }
    }, [scenes, currentSceneId, goToScene, onGameEnd]);

    const handleHotspotClick = useCallback((hotspotId: string, result?: string) => {
        setGameState(prev => ({
            ...prev,
            [`clicked_${hotspotId}`]: true,
            lastClicked: hotspotId,
        }));

        if (result) {
            goToScene(result);
        }
    }, [goToScene]);

    const restart = useCallback(() => {
        setCurrentSceneId(scenes[0]?.id);
        setGameState({});
        setHistory([]);
    }, [scenes]);

    return {
        currentScene,
        allBackgrounds,
        gameState,
        history,
        handleAdvance,
        handleHotspotClick,
        goToScene,
        restart,
    };
}