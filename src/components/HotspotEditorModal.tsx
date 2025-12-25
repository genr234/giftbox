import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SceneNode, Hotspot, Position } from '../app/types';

interface HotspotEditorModalProps {
    node: SceneNode;
    onClose: () => void;
    onUpdateHotspots: (hotspots: Hotspot[]) => void;
}

export function HotspotEditorModal({ node, onClose, onUpdateHotspots }: HotspotEditorModalProps) {
    const [hotspots, setHotspots] = useState<Hotspot[]>(node.data.hotspots || []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState({x: 0, y: 0});
    const [currentDraw, setCurrentDraw] = useState({x: 0, y: 0, width: 0, height: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({x: 0, y: 0});
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageBounds, setImageBounds] = useState({offsetX: 0, offsetY: 0, width: 0, height: 0});

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const selectedHotspot = hotspots.find(h => h.id === selectedId);

    // Calculate image bounds for proper scaling
    const calculateImageBounds = useCallback(() => {
        const container = containerRef.current;
        const img = imageRef.current;
        if (!container || !img || !img.naturalWidth) return;

        const containerRect = container.getBoundingClientRect();
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerRect.width / containerRect.height;

        let width, height, offsetX, offsetY;

        if (imageAspect > containerAspect) {
            width = containerRect.width;
            height = containerRect.width / imageAspect;
            offsetX = 0;
            offsetY = (containerRect.height - height) / 2;
        } else {
            height = containerRect.height;
            width = containerRect.height * imageAspect;
            offsetX = (containerRect.width - width) / 2;
            offsetY = 0;
        }

        setImageBounds({offsetX, offsetY, width, height});
    }, []);

    useEffect(() => {
        calculateImageBounds();
        window.addEventListener('resize', calculateImageBounds);
        return () => window.removeEventListener('resize', calculateImageBounds);
    }, [calculateImageBounds, imageLoaded]);

    // Convert screen position to percentage within image
    const getImagePercent = useCallback((e: React.MouseEvent): Position => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || !imageBounds.width) return {x: 0, y: 0};

        const relX = e.clientX - rect.left - imageBounds.offsetX;
        const relY = e.clientY - rect.top - imageBounds.offsetY;

        return {
            x: Math.max(0, Math.min(100, (relX / imageBounds.width) * 100)),
            y: Math.max(0, Math.min(100, (relY / imageBounds.height) * 100)),
        };
    }, [imageBounds]);

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.hotspot-handle')) return;
        if ((e.target as HTMLElement).closest('.hotspot-box')) return;

        const pos = getImagePercent(e);
        if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) return;

        setIsDrawing(true);
        setDrawStart(pos);
        setCurrentDraw({x: pos.x, y: pos.y, width: 0, height: 0});
        setSelectedId(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getImagePercent(e);

        if (isDrawing) {
            setCurrentDraw({
                x: Math.min(drawStart.x, pos.x),
                y: Math.min(drawStart.y, pos.y),
                width: Math.abs(pos.x - drawStart.x),
                height: Math.abs(pos.y - drawStart.y),
            });
        } else if (isDragging && selectedId) {
            setHotspots(prev => prev.map(h => {
                if (h.id === selectedId) {
                    return {
                        ...h,
                        x: Math.max(0, Math.min(100 - h.width, pos.x - dragOffset.x)),
                        y: Math.max(0, Math.min(100 - h.height, pos.y - dragOffset.y)),
                    };
                }
                return h;
            }));
        } else if (isResizing && selectedId) {
            setHotspots(prev => prev.map(h => {
                if (h.id === selectedId) {
                    let {x, y, width, height} = h;

                    if (isResizing.includes('e')) width = Math.max(3, pos.x - h.x);
                    if (isResizing.includes('w')) {
                        width = Math.max(3, h.x + h.width - pos.x);
                        x = Math.min(pos.x, h.x + h.width - 3);
                    }
                    if (isResizing.includes('s')) height = Math.max(3, pos.y - h.y);
                    if (isResizing.includes('n')) {
                        height = Math.max(3, h.y + h.height - pos.y);
                        y = Math.min(pos.y, h.y + h.height - 3);
                    }

                    return {...h, x, y, width, height};
                }
                return h;
            }));
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && currentDraw.width > 2 && currentDraw.height > 2) {
            const newHotspot: Hotspot = {
                id: `hotspot-${Date.now().toString().slice(-4)}`,
                x: Math.round(currentDraw.x * 10) / 10,
                y: Math.round(currentDraw.y * 10) / 10,
                width: Math.round(currentDraw.width * 10) / 10,
                height: Math.round(currentDraw.height * 10) / 10,
                hoverHint: 'click to interact',
            };
            setHotspots(prev => [...prev, newHotspot]);
            setSelectedId(newHotspot.id);
        }

        setIsDrawing(false);
        setIsDragging(false);
        setIsResizing(null);
        setCurrentDraw({x: 0, y: 0, width: 0, height: 0});
    };

    const handleHotspotMouseDown = (e: React.MouseEvent, hotspot: Hotspot) => {
        e.stopPropagation();
        const pos = getImagePercent(e);
        setSelectedId(hotspot.id);
        setDragOffset({x: pos.x - hotspot.x, y: pos.y - hotspot.y});
        setIsDragging(true);
    };

    const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        setIsResizing(direction);
    };

    const updateHotspot = (id: string, updates: Partial<Hotspot>) => {
        setHotspots(prev => prev.map(h => h.id === id ? {...h, ...updates} : h));
    };

    const deleteHotspot = (id: string) => {
        setHotspots(prev => prev.filter(h => h.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                if (document.activeElement?.tagName !== 'INPUT') {
                    e.preventDefault();
                    deleteHotspot(selectedId);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, onClose]);

    const handleSave = () => {
        onUpdateHotspots(hotspots);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
                className="bg-stone-900 rounded-xl border border-stone-700 shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
                <div
                    className="flex-shrink-0 px-4 py-3 bg-stone-800 border-b border-stone-700 flex items-center justify-between">
                        <span className="text-xs text-stone-500">{node.id}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                        >
                            cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium transition-colors"
                        >
                            save
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 relative bg-stone-950 overflow-hidden">
                        <div
                            ref={containerRef}
                            className="absolute inset-4 cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {node.data.background ? (
                                <>
                                    <img
                                        ref={imageRef}
                                        src={node.data.background}
                                        alt="Scene background"
                                        className="w-full h-full object-contain pointer-events-none"
                                        draggable={false}
                                        onLoad={() => {
                                            setImageLoaded(true);
                                            calculateImageBounds();
                                        }}
                                    />

                                    {/* Hotspots */}
                                    {imageLoaded && hotspots.map(hotspot => {
                                        const left = imageBounds.offsetX + (hotspot.x / 100) * imageBounds.width;
                                        const top = imageBounds.offsetY + (hotspot.y / 100) * imageBounds.height;
                                        const width = (hotspot.width / 100) * imageBounds.width;
                                        const height = (hotspot.height / 100) * imageBounds.height;
                                        const isSelected = selectedId === hotspot.id;

                                        return (
                                            <div
                                                key={hotspot.id}
                                                className={`hotspot-box absolute border-2 cursor-move transition-colors
                          ${isSelected
                                                    ? 'border-amber-400 bg-amber-400/20 z-10'
                                                    : 'border-emerald-400 bg-emerald-400/15 hover:border-emerald-300'
                                                }
                        `}
                                                style={{left, top, width, height}}
                                                onMouseDown={(e) => handleHotspotMouseDown(e, hotspot)}
                                            >
                                                {/* Label */}
                                                <div
                                                    className="absolute -top-6 left-0 text-xs bg-stone-900/90 text-stone-200 px-2 py-0.5 rounded whitespace-nowrap">
                                                    {hotspot.id}
                                                </div>

                                                {/* Resize handles */}
                                                {isSelected && (
                                                    <>
                                                        {['nw', 'ne', 'sw', 'se'].map(dir => (
                                                            <div
                                                                key={dir}
                                                                className={`hotspot-handle absolute w-3 h-3 bg-amber-400 rounded-full cursor-${dir}-resize
                                  ${dir.includes('n') ? '-top-1.5' : '-bottom-1.5'}
                                  ${dir.includes('w') ? '-left-1.5' : '-right-1.5'}
                                `}
                                                                onMouseDown={(e) => handleResizeMouseDown(e, dir)}
                                                            />
                                                        ))}
                                                        {['n', 's', 'e', 'w'].map(dir => (
                                                            <div
                                                                key={dir}
                                                                className={`hotspot-handle absolute bg-amber-400/60 rounded cursor-${dir}-resize
                                  ${dir === 'n' || dir === 's' ? 'left-1/2 -translate-x-1/2 w-6 h-2' : 'top-1/2 -translate-y-1/2 h-6 w-2'}
                                  ${dir === 'n' ? '-top-1' : dir === 's' ? '-bottom-1' : dir === 'w' ? '-left-1' : '-right-1'}
                                `}
                                                                onMouseDown={(e) => handleResizeMouseDown(e, dir)}
                                                            />
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Current drawing */}
                                    {isDrawing && currentDraw.width > 0 && currentDraw.height > 0 && (
                                        <div
                                            className="absolute border-2 border-dashed border-amber-300 bg-amber-300/20 pointer-events-none"
                                            style={{
                                                left: imageBounds.offsetX + (currentDraw.x / 100) * imageBounds.width,
                                                top: imageBounds.offsetY + (currentDraw.y / 100) * imageBounds.height,
                                                width: (currentDraw.width / 100) * imageBounds.width,
                                                height: (currentDraw.height / 100) * imageBounds.height,
                                            }}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-stone-600">
                                    <div className="text-center">
                                        <p>no background image set for this scene</p>
                                        <p className="text-sm mt-1">set a background path in the inspector first</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-72 bg-stone-900 border-l border-stone-800 flex flex-col">
                        <div className="p-3 border-b border-stone-800">
                            <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wide">
                                Hotspots ({hotspots.length})
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {hotspots.length === 0 ? (
                                <p className="text-xs text-stone-600 italic text-center py-4">
                                    hotspots will appear here :yay:
                                </p>
                            ) : (
                                hotspots.map(h => (
                                    <button
                                        key={h.id}
                                        onClick={() => setSelectedId(h.id)}
                                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors
                      ${selectedId === h.id
                                            ? 'bg-amber-500/20 border border-amber-500/50'
                                            : 'bg-stone-800 hover:bg-stone-750 border border-transparent'
                                        }
                    `}
                                    >
                                        <div className="font-medium text-stone-200">{h.id}</div>
                                        <div className="text-stone-500 text-[10px] mt-0.5">
                                            ({h.x.toFixed(1)}%, {h.y.toFixed(1)}%)
                                            — {h.width.toFixed(1)}×{h.height.toFixed(1)}%
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {selectedHotspot && (
                            <div className="flex-shrink-0 border-t border-stone-800 p-3 space-y-3 bg-stone-850">
                                <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wide">
                                    edit: {selectedHotspot.id}
                                </div>

                                <div>
                                    <label className="block text-[10px] text-stone-500 mb-1">ID</label>
                                    <input
                                        type="text"
                                        value={selectedHotspot.id}
                                        onChange={(e) => updateHotspot(selectedHotspot.id, {id: e.target.value})}
                                        className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-stone-500 mb-1">X (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={selectedHotspot.x}
                                            onChange={(e) => updateHotspot(selectedHotspot.id, {x: parseFloat(e.target.value) || 0})}
                                            className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-stone-500 mb-1">Y (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={selectedHotspot.y}
                                            onChange={(e) => updateHotspot(selectedHotspot.id, {y: parseFloat(e.target.value) || 0})}
                                            className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-stone-500 mb-1">Width (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={selectedHotspot.width}
                                            onChange={(e) => updateHotspot(selectedHotspot.id, {width: parseFloat(e.target.value) || 0})}
                                            className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-stone-500 mb-1">Height (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={selectedHotspot.height}
                                            onChange={(e) => updateHotspot(selectedHotspot.id, {height: parseFloat(e.target.value) || 0})}
                                            className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-stone-500 mb-1">hover hint</label>
                                    <input
                                        type="text"
                                        value={selectedHotspot.hoverHint || ''}
                                        onChange={(e) => updateHotspot(selectedHotspot.id, {hoverHint: e.target.value})}
                                        placeholder="Click to interact"
                                        className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedHotspot.showLetter || false}
                                            onChange={(e) => updateHotspot(selectedHotspot.id, {showLetter: e.target.checked})}
                                            className="w-4 h-4 rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-xs text-stone-300">show letter on click</span>
                                    </label>
                                    <p className="text-[10px] text-stone-600 mt-1 ml-6">
                                        displays the letter component instead of triggering result immediately
                                    </p>
                                </div>

                                <button
                                    onClick={() => deleteHotspot(selectedHotspot.id)}
                                    className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50
                    rounded text-xs transition-colors"
                                >
                                    delete hotspot
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}