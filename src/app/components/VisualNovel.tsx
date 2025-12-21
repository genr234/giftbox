'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface DialogueLine {
    speaker?: string;
    text: string;
    speakerColor?: string;
}

export interface Hotspot {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    cursor?: string;
    onClickResult?: string;
    hoverHint?: string;
}

export interface BaseScene {
    id: string;
    background: string;
    transition?: 'fade' | 'fadeBlack' | 'instant';
    transitionDuration?: number;
}

export interface DialogueScene extends BaseScene {
    type: 'dialogue';
    dialogue: DialogueLine;
    nextSceneId?: string;
}

export interface ExplorationScene extends BaseScene {
    type: 'exploration';
    hotspots: Hotspot[];
    hint?: string;
}

export type Scene = DialogueScene | ExplorationScene;

interface VisualNovelProps {
    scene: Scene;
    allBackgrounds?: string[];
    onAdvance?: (nextSceneId?: string) => void;
    onHotspotClick?: (hotspotId: string, result?: string) => void;
    textSpeed?: number;
}

// Preload images
function usePreloadImages(images: string[]) {
    useEffect(() => {
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, [images]);
}

export default function VisualNovel({
                                        scene,
                                        allBackgrounds = [],
                                        onAdvance,
                                        onHotspotClick,
                                        textSpeed = 35,
                                    }: VisualNovelProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [backgrounds, setBackgrounds] = useState({
        current: scene.background,
        previous: null as string | null,
    });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [blackOverlay, setBlackOverlay] = useState(false);
    const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
    const [clickedHotspot, setClickedHotspot] = useState<string | null>(null);

    const textIndexRef = useRef(0);
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    usePreloadImages(allBackgrounds);

    useEffect(() => {
        if (scene.background === backgrounds.current) return;

        const transition = scene.transition || 'fade';
        const duration = scene.transitionDuration || 800;

        if (transition === 'instant') {
            setBackgrounds({ current: scene.background, previous: null });
            return;
        }

        if (transition === 'fadeBlack') {
            setBlackOverlay(true);
            setTimeout(() => {
                setBackgrounds({ current: scene.background, previous: null });
                setTimeout(() => setBlackOverlay(false), duration / 2);
            }, duration / 2);
            return;
        }

        setBackgrounds(prev => ({
            current: scene.background,
            previous: prev.current,
        }));
        setIsTransitioning(true);

        const timer = setTimeout(() => {
            setIsTransitioning(false);
            setBackgrounds(prev => ({ ...prev, previous: null }));
        }, duration);

        return () => clearTimeout(timer);
    }, [scene.background, scene.transition, scene.transitionDuration]);

    useEffect(() => {
        if (scene.type !== 'dialogue') return;

        setDisplayedText('');
        textIndexRef.current = 0;
        setIsTyping(true);

        typingIntervalRef.current = setInterval(() => {
            if (textIndexRef.current < scene.dialogue.text.length) {
                setDisplayedText(scene.dialogue.text.slice(0, textIndexRef.current + 1));
                textIndexRef.current += 1;
            } else {
                setIsTyping(false);
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                }
            }
        }, textSpeed);

        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [scene, textSpeed]);

    const handleDialogueClick = useCallback(() => {
        if (scene.type !== 'dialogue') return;

        if (isTyping) {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
            setDisplayedText(scene.dialogue.text);
            setIsTyping(false);
        } else {
            onAdvance?.(scene.nextSceneId);
        }
    }, [scene, isTyping, onAdvance]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (scene.type === 'dialogue' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleDialogueClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scene.type, handleDialogueClick]);

    const handleHotspotClick = (hotspot: Hotspot) => {
        setClickedHotspot(hotspot.id);
        setTimeout(() => setClickedHotspot(null), 200);
        onHotspotClick?.(hotspot.id, hotspot.onClickResult);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden select-none bg-stone-900">
            <div className="absolute inset-0">
                {backgrounds.previous && (
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out"
                        style={{
                            backgroundImage: `url(${backgrounds.previous})`,
                            opacity: isTransitioning ? 0 : 1,
                        }}
                    />
                )}

                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out"
                    style={{
                        backgroundImage: `url(${backgrounds.current})`,
                        opacity: blackOverlay ? 0 : 1,
                    }}
                />

                <div
                    className="absolute inset-0 bg-stone-900 transition-opacity duration-500 pointer-events-none"
                    style={{ opacity: blackOverlay ? 1 : 0 }}
                />
            </div>

            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(41, 37, 36, 0.5) 100%)',
                }}
            />

            <div className="absolute inset-0 pointer-events-none bg-amber-900/5" />

            {scene.type === 'exploration' && (
                <>
                    {scene.hotspots.map((hotspot) => (
                        <button
                            key={hotspot.id}
                            className={`absolute rounded-lg transition-all duration-300 ease-out
                ${hoveredHotspot === hotspot.id
                                ? 'bg-amber-100/20 shadow-[0_0_30px_rgba(251,243,219,0.3)] ring-2 ring-amber-200/40'
                                : 'bg-transparent hover:bg-amber-100/10'}
                ${clickedHotspot === hotspot.id ? 'scale-95' : 'scale-100'}
                focus:outline-none focus:ring-2 focus:ring-amber-200/50
              `}
                            style={{
                                left: `${hotspot.x}%`,
                                top: `${hotspot.y}%`,
                                width: `${hotspot.width}%`,
                                height: `${hotspot.height}%`,
                                cursor: hotspot.cursor || 'pointer',
                            }}
                            onClick={() => handleHotspotClick(hotspot)}
                            onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                            onMouseLeave={() => setHoveredHotspot(null)}
                        />
                    ))}

                    {hoveredHotspot && (
                        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                            <div className="bg-stone-800/95 backdrop-blur-sm text-amber-100
                px-5 py-2.5 rounded-full text-sm font-medium
                shadow-lg border border-amber-200/20">
                                {scene.hotspots.find(h => h.id === hoveredHotspot)?.hoverHint || 'Click to interact'}
                            </div>
                        </div>
                    )}

                    {scene.hint && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                            <div className="text-amber-100/50 text-sm italic font-serif">
                                {scene.hint}
                            </div>
                        </div>
                    )}
                </>
            )}

            {scene.type === 'dialogue' && (
                <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={handleDialogueClick}
                >
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 z-20">
                        <div className="max-w-4xl mx-auto">

                            <div className="relative bg-gradient-to-b from-stone-800/95 to-stone-900/95
                backdrop-blur-md rounded-2xl shadow-2xl
                border border-amber-100/10 overflow-hidden">

                                <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                                     style={{
                                         backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                                     }}
                                />

                                <div className="absolute inset-0 bg-gradient-to-b from-amber-100/5 to-transparent pointer-events-none" />

                                <div className="relative p-5 sm:p-6">
                                    {scene.dialogue.speaker && (
                                        <div className="mb-3">
                      <span
                          className="inline-block text-lg font-semibold font-serif tracking-wide"
                          style={{ color: scene.dialogue.speakerColor || '#fcd34d' }}
                      >
                        {scene.dialogue.speaker}
                      </span>
                                            <div
                                                className="h-0.5 w-12 mt-1 rounded-full opacity-60"
                                                style={{ backgroundColor: scene.dialogue.speakerColor || '#fcd34d' }}
                                            />
                                        </div>
                                    )}

                                    <div className="font-serif text-lg sm:text-xl leading-relaxed text-stone-100 min-h-[80px]">
                                        {displayedText}
                                        {isTyping && (
                                            <span className="inline-block w-0.5 h-5 ml-1 bg-amber-200 animate-blink align-middle" />
                                        )}
                                    </div>

                                    {!isTyping && (
                                        <div className="flex justify-end mt-3">
                                            <div className="flex items-center gap-2 text-amber-200/60 text-sm">
                                                <span className="font-serif italic">continue</span>
                                                <svg
                                                    className="w-4 h-4 animate-gentle-bounce"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center mt-3">
                                <div className="flex items-center gap-1 text-stone-800/95">
                                    <span>✦</span>
                                    <span className="text-xs font-serif">click or press space</span>
                                    <span>✦</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
