"use client";
import Image from "next/image";
import {hurricane, meowScript} from "@/app/lib/fonts";
import {useEffect, useRef} from "react";

type EasingName = 'easeOutCubic' | 'linear' | 'easeInOutCubic';

type LetterProps = {
    initialZoom?: number; // start scale (defaults to 0.4)
    toZoom?: number; // end scale (defaults to 1)
    duration?: number; // ms (defaults to 300)
    easing?: EasingName;
    onClose?: () => void; // callback for closing the letter
};

export default function Letter({
    initialZoom = 0.4,
    toZoom = 1,
    duration = 300,
    easing = 'easeOutCubic',
    onClose,
}: LetterProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);

    // Handle ESC key to close
    useEffect(() => {
        if (!onClose) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const from = Math.max(0, Math.min(initialZoom, 4));
        const to = Math.max(0, Math.min(toZoom, 4));
        const dur = Math.max(0, duration || 0);

        const getEase = (name: EasingName) => {
            switch (name) {
                case 'linear':
                    return (t: number) => t;
                case 'easeInOutCubic':
                    return (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                case 'easeOutCubic':
                default:
                    return (t: number) => 1 - Math.pow(1 - t, 3);
            }
        };

        const easeFn = getEase(easing);

        // helper to set transform while preserving translate centering
        const setTransform = (value: number) => {
            if (containerRef.current) {
                containerRef.current.style.transform = `translate(-50%, -50%) scale(${value})`;
            }
        };

        const setVisible = (visible: boolean) => {
            if (containerRef.current) {
                containerRef.current.style.opacity = visible ? '1' : '0';
            }
        };

        if (containerRef.current) {
            containerRef.current.style.transform = `translate(-50%, -50%) scale(${from})`;
            containerRef.current.style.transformOrigin = 'center center';
            containerRef.current.style.willChange = 'transform, opacity';
            containerRef.current.style.opacity = '0';
            containerRef.current.style.pointerEvents = 'none';
        }

        // show and optionally animate
        const start = performance.now();

        requestAnimationFrame(() => {
            // dispatch start event so parent can react
            if (typeof window !== 'undefined') {
                try {
                    window.dispatchEvent(new CustomEvent('letterStart', { detail: { from, to, duration: dur } }));
                } catch (e) {
                    // ignore if CustomEvent isn't supported (very old browsers)
                }
            }

            setVisible(true);
            if (containerRef.current) containerRef.current.style.pointerEvents = '';

            // if reduced motion or no duration or from === to, jump to final state
            if (prefersReduced || dur === 0 || from === to) {
                setTransform(to);
                if (typeof window !== 'undefined') {
                    try {
                        window.dispatchEvent(new CustomEvent('letterComplete', { detail: { from, to } }));
                    } catch (e) {}
                }
                return;
            }

            const animate = (now: number) => {
                const elapsed = now - start;
                const progress = Math.min(1, elapsed / dur);
                const eased = easeFn(progress);
                const value = from + (to - from) * eased;
                setTransform(value);

                if (progress < 1) {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    rafRef.current = null;
                    if (typeof window !== 'undefined') {
                        try {
                            window.dispatchEvent(new CustomEvent('letterComplete', { detail: { from, to } }));
                        } catch (e) {}
                    }
                }
            };

            rafRef.current = requestAnimationFrame(animate);
        });

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [initialZoom, toZoom, duration, easing]);

    return (
        // full-screen center container with dark overlay
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-auto">
                <div className="flex items-center justify-center">
                    <div
                        className="relative"
                        style={{
                            aspectRatio: '595 / 802',
                            width: `min(90vw, 595px)`,
                            maxWidth: '100%',
                            display: 'block',
                            margin: '0 auto',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* inner wrapper: absolutely centered and scaled around its center */}
                        <div
                            ref={containerRef}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '100%',
                                height: '100%',
                                // initial values set by effect to avoid flashes
                                transformOrigin: 'center center',
                                transition: 'opacity 120ms linear',
                                willChange: 'transform, opacity',
                                transformStyle: 'preserve-3d',
                                opacity: 0,
                            }}
                        >
                            <Image src="/letter.png" alt="Letter" fill style={{ objectFit: 'contain' }} draggable={false} />

                            <div className="absolute pointer-events-auto" style={{ top: '22%', left: '19%' }}>
                                <div className="w-auto max-w-[85%] text-left whitespace-normal break-words">
                                    <h1 className={`text-7xl font-bold ${hurricane.className} text-gray-900`}>Dear Patricia</h1>
                                    <p className={`mt-4 sm:text-xl ${meowScript.className} text-gray-700`}>
                                        I hope this letter finds you well.<br /> If you're reading this it means i'm no longer here. <br/> I wanted to take a moment to tell you how proud I am of the person you are becoming. Your kindness, intelligence, and creativity never cease to amaze me.<br /><br />
                                        Remember to always follow your dreams and stay true to yourself. The world is full of opportunities waiting for you to seize them.<br /><br />
                                        As a token of my love i left the old cafe by the park in your name. I hope you find joy and comfort there, just as I did.<br /><br />
                                        With all my love,<br />
                                        Grandpa
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Close button */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="fixed top-8 right-8 bg-stone-800/90 hover:bg-stone-700 text-stone-200 px-4 py-2 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm border border-stone-600"
                >
                    close
                </button>
            )}
        </div>
    );
}