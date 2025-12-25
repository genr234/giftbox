'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GraphNode } from './GraphNode';
import { NodeInspector } from './NodeInspector';
import { HotspotEditorModal } from './HotspotEditorModal';
import type { SceneNode, GraphState, Position } from '../app/types';
import { generateCode } from '../app/lib/codeGenerator';
import { saveGraph, loadGraph } from '../app/lib/fileManager';

const GRID_SIZE = 20;
const NODE_WIDTH = 220;

const DEFAULT_STATE: GraphState = {
    nodes: [{ id: 'start', type: 'start', position: { x: 100, y: 300 }, data: {} }],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
};

export default function Editor() {
    const [state, setState] = useState<GraphState>(DEFAULT_STATE);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [hotspotEditorNodeId, setHotspotEditorNodeId] = useState<string | null>(null);

    const [draggingNode, setDraggingNode] = useState<{ id: string; offset: Position } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState<{ from: string; port?: string } | null>(null);
    const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });

    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedNode = state.nodes.find(n => n.id === selectedNodeId);
    const hotspotEditorNode = state.nodes.find(n => n.id === hotspotEditorNodeId);

    const availableSceneIds = useMemo(() =>
        state.nodes.filter(n => n.type !== 'start').map(n => n.id),
        [state.nodes]
    );

    const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (screenX - rect.left - state.viewport.x) / state.viewport.zoom,
            y: (screenY - rect.top - state.viewport.y) / state.viewport.zoom,
        };
    }, [state.viewport]);

    const snapToGrid = useCallback((pos: number) => Math.round(pos / GRID_SIZE) * GRID_SIZE, []);

    const addNode = (type: SceneNode['type']) => {
        const id = `${type}-${Date.now().toString().slice(-4)}`;
        const center = screenToCanvas(window.innerWidth / 2 - 200, window.innerHeight / 2);

        const newNode: SceneNode = {
            id,
            type,
            position: { x: snapToGrid(center.x), y: snapToGrid(center.y) },
            data: {
                background: '',
                transition: 'fade',
                ...(type === 'dialogue' && {
                    dialogue: { text: 'Enter dialogue...', speaker: '', speakerColor: '#fcd34d' }
                }),
                ...(type === 'exploration' && {
                    hotspots: [],
                    hint: 'Look around...'
                }),
            },
        };

        setState(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
        setSelectedNodeId(id);
    };

    const deleteNode = useCallback((id: string) => {
        if (id === 'start') return;
        setState(prev => ({
            ...prev,
            nodes: prev.nodes.filter(n => n.id !== id),
            connections: prev.connections.filter(c => c.from !== id && c.to !== id),
        }));
        setSelectedNodeId(null);
        setHotspotEditorNodeId(null);
    }, []);

    const updateNodeData = useCallback((nodeId: string, updates: Partial<SceneNode['data']>) => {
        setState(prev => ({
            ...prev,
            nodes: prev.nodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
            ),
        }));
    }, []);

    const renameNode = useCallback((oldId: string, newId: string) => {
        if (state.nodes.find(n => n.id === newId && n.id !== oldId)) return;
        setState(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === oldId ? { ...n, id: newId } : n),
            connections: prev.connections.map(c => ({
                ...c,
                from: c.from === oldId ? newId : c.from,
                to: c.to === oldId ? newId : c.to,
            })),
        }));
        if (selectedNodeId === oldId) setSelectedNodeId(newId);
        if (hotspotEditorNodeId === oldId) setHotspotEditorNodeId(newId);
    }, [state.nodes, selectedNodeId, hotspotEditorNodeId]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });

            if (draggingNode) {
                const coords = screenToCanvas(e.clientX, e.clientY);
                setState(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n => n.id === draggingNode.id ? {
                        ...n,
                        position: {
                            x: snapToGrid(coords.x - draggingNode.offset.x),
                            y: snapToGrid(coords.y - draggingNode.offset.y)
                        }
                    } : n)
                }));
            }

            if (isPanning) {
                setState(prev => ({
                    ...prev,
                    viewport: {
                        ...prev.viewport,
                        x: prev.viewport.x + e.movementX,
                        y: prev.viewport.y + e.movementY,
                    }
                }));
            }
        };

        const handleGlobalMouseUp = () => {
            setDraggingNode(null);
            setIsPanning(false);
            setTimeout(() => setIsConnecting(null), 50);
        };

        if (draggingNode || isPanning || isConnecting) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [draggingNode, isPanning, isConnecting, screenToCanvas, snapToGrid]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (hotspotEditorNodeId) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement?.tagName === 'INPUT' ||
                    document.activeElement?.tagName === 'TEXTAREA') return;

                if (selectedNodeId && selectedNodeId !== 'start') {
                    deleteNode(selectedNodeId);
                } else if (selectedConnectionId) {
                    setState(prev => ({
                        ...prev,
                        connections: prev.connections.filter(c => c.id !== selectedConnectionId)
                    }));
                    setSelectedConnectionId(null);
                }
            }
            if (e.key === 'Escape') {
                setSelectedNodeId(null);
                setSelectedConnectionId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, selectedConnectionId, hotspotEditorNodeId, deleteNode]);

    const handleNodeStartDrag = (e: React.MouseEvent, node: SceneNode) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const coords = screenToCanvas(e.clientX, e.clientY);
        setDraggingNode({
            id: node.id,
            offset: { x: coords.x - node.position.x, y: coords.y - node.position.y }
        });
        setSelectedNodeId(node.id);
        setSelectedConnectionId(null);
    };

    const handleConnectionStart = (e: React.MouseEvent, nodeId: string, port?: string) => {
        e.stopPropagation();
        setIsConnecting({ from: nodeId, port });
    };

    const handleNodeDrop = (targetNodeId: string) => {
        if (isConnecting && isConnecting.from !== targetNodeId) {
            const from = isConnecting.from;
            const port = isConnecting.port;

            setState(prev => {
                const filtered = prev.connections.filter(c => !(c.from === from && c.fromPort === port));
                return {
                    ...prev,
                    connections: [...filtered, {
                        id: `conn-${Date.now()}`,
                        from,
                        to: targetNodeId,
                        fromPort: port
                    }]
                };
            });
        }
        setIsConnecting(null);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.2, Math.min(2, state.viewport.zoom * delta));
            setState(prev => ({ ...prev, viewport: { ...prev.viewport, zoom: newZoom } }));
        } else {
            setState(prev => ({
                ...prev,
                viewport: {
                    ...prev.viewport,
                    x: prev.viewport.x - e.deltaX,
                    y: prev.viewport.y - e.deltaY
                }
            }));
        }
    };

    const getPortPosition = (nodeId: string, portType: 'in' | 'out' | string): Position => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };

        if (portType === 'in') return { x: node.position.x, y: node.position.y + 40 };
        if (portType === 'out') return { x: node.position.x + NODE_WIDTH, y: node.position.y + 40 };

        const hIndex = node.data.hotspots?.findIndex(h => h.id === portType) ?? 0;
        return { x: node.position.x + NODE_WIDTH, y: node.position.y + 115 + (hIndex * 32) };
    };

    const handleLoadGraph = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await loadGraph(file);
            setState(data);
            setSelectedNodeId(null);
            setHotspotEditorNodeId(null);
        } catch {
            console.error('Failed to load graph');
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-stone-950 text-stone-100 select-none font-sans overflow-hidden">
            <header className="h-12 flex-shrink-0 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => addNode('dialogue')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
                        >
                            dialogue
                        </button>
                        <button
                            type="button"
                            onClick={() => addNode('exploration')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium transition-colors"
                        >
                            exploration
                        </button>
                        <button
                            type="button"
                            onClick={() => addNode('end')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-medium transition-colors"
                        >
                            end
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">
                        {Math.round(state.viewport.zoom * 100)}%
                    </span>
                    <div className="h-4 w-px bg-stone-700" />
                    <label className="px-3 py-1 bg-stone-800 hover:bg-stone-700 rounded text-xs cursor-pointer transition-colors">
                        Load
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadGraph} className="hidden" />
                    </label>
                    <button
                        type="button"
                        onClick={() => saveGraph(state)}
                        className="px-3 py-1 bg-stone-800 hover:bg-stone-700 rounded text-xs transition-colors"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCode(!showCode)}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                            showCode ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 hover:bg-stone-700'
                        }`}
                    >
                        {'</>'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                <main
                    ref={canvasRef}
                    className="flex-1 relative overflow-hidden"
                    style={{ cursor: isPanning ? 'grabbing' : 'default' }}
                    onMouseDown={(e) => {
                        if (e.button === 1 || (e.button === 0 && e.altKey)) {
                            setIsPanning(true);
                        } else if (e.target === canvasRef.current) {
                            setSelectedNodeId(null);
                            setSelectedConnectionId(null);
                        }
                    }}
                    onWheel={handleWheel}
                >
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.04]"
                        style={{
                            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
                            backgroundSize: `${GRID_SIZE * state.viewport.zoom}px ${GRID_SIZE * state.viewport.zoom}px`,
                            backgroundPosition: `${state.viewport.x}px ${state.viewport.y}px`
                        }}
                    />

                    <div
                        style={{
                            transform: `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.zoom})`,
                            transformOrigin: '0 0'
                        }}
                    >
                        <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ width: 1, height: 1 }} role="img" aria-label="Scene connections">
                            <defs>
                                <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#57534e" />
                                </marker>
                                <marker id="arrow-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                                </marker>
                            </defs>

                            {state.connections.map(conn => {
                                const from = getPortPosition(conn.from, conn.fromPort || 'out');
                                const to = getPortPosition(conn.to, 'in');
                                const isSelected = selectedConnectionId === conn.id;
                                const dx = Math.abs(to.x - from.x) * 0.5;

                                return (
                                    <g key={conn.id} className="pointer-events-auto">
                                        <path
                                            d={`M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`}
                                            stroke={isSelected ? '#fbbf24' : '#57534e'}
                                            strokeWidth={isSelected ? 3 : 2}
                                            fill="none"
                                            markerEnd={isSelected ? "url(#arrow-selected)" : "url(#arrow)"}
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedConnectionId(conn.id);
                                                setSelectedNodeId(null);
                                            }}
                                        />
                                    </g>
                                );
                            })}

                            {isConnecting && (() => {
                                const from = getPortPosition(isConnecting.from, isConnecting.port || 'out');
                                const to = screenToCanvas(mousePos.x, mousePos.y);
                                const dx = Math.abs(to.x - from.x) * 0.5;
                                return (
                                    <path
                                        key="active-connection"
                                        d={`M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`}
                                        stroke="#fbbf24"
                                        strokeWidth={2}
                                        strokeDasharray="6,4"
                                        fill="none"
                                    />
                                );
                            })()}
                        </svg>

                        {state.nodes.map(node => (
                            <GraphNode
                                key={node.id}
                                node={node}
                                isSelected={selectedNodeId === node.id}
                                connections={state.connections}
                                onStartDrag={(e) => handleNodeStartDrag(e, node)}
                                onStartConnect={handleConnectionStart}
                                onDrop={() => handleNodeDrop(node.id)}
                            />
                        ))}
                    </div>
                </main>

                <aside className="w-80 bg-stone-900 border-l border-stone-800 flex flex-col">
                    <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                            inspector
                        </span>
                        {selectedNode && selectedNode.id !== 'start' && (
                            <button
                                type="button"
                                onClick={() => deleteNode(selectedNode.id)}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                delete
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {selectedNode ? (
                            <NodeInspector
                                node={selectedNode}
                                connections={state.connections}
                                availableSceneIds={availableSceneIds}
                                onUpdateData={(updates) => updateNodeData(selectedNode.id, updates)}
                                onRename={(newId) => renameNode(selectedNode.id, newId)}
                                onOpenHotspotEditor={() => setHotspotEditorNodeId(selectedNode.id)}
                                onUpdateConnection={(fromPort, toId) => {
                                    setState(prev => {
                                        const filtered = prev.connections.filter(
                                            c => !(c.from === selectedNode.id && c.fromPort === fromPort)
                                        );
                                        if (toId) {
                                            return {
                                                ...prev,
                                                connections: [...filtered, {
                                                    id: `conn-${Date.now()}`,
                                                    from: selectedNode.id,
                                                    to: toId,
                                                    fromPort,
                                                }]
                                            };
                                        }
                                        return { ...prev, connections: filtered };
                                    });
                                }}
                            />
                        ) : selectedConnectionId ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-stone-500 mb-4">Connection Selected</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setState(prev => ({
                                            ...prev,
                                            connections: prev.connections.filter(c => c.id !== selectedConnectionId)
                                        }));
                                        setSelectedConnectionId(null);
                                    }}
                                    className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-800/50 rounded text-xs"
                                >
                                    delete connection
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-sm text-stone-600 italic">
                                select something... or don't, i don't make the rules.
                            </div>
                        )}
                    </div>
                </aside>

                {showCode && (
                    <div className="absolute inset-y-0 right-80 w-[400px] bg-stone-950 border-l border-stone-800 flex flex-col z-10">
                        <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-amber-500">Generated Code</span>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(generateCode(state));
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="text-xs bg-stone-800 hover:bg-stone-700 px-3 py-1 rounded"
                            >
                                {copied ? 'yay' : 'copy'}
                            </button>
                        </div>
                        <pre className="flex-1 p-4 text-[11px] font-mono overflow-auto text-emerald-400/80">
                            {generateCode(state)}
                        </pre>
                    </div>
                )}
            </div>

            {hotspotEditorNode && hotspotEditorNode.type === 'exploration' && (
                <HotspotEditorModal
                    node={hotspotEditorNode}
                    onClose={() => setHotspotEditorNodeId(null)}
                    onUpdateHotspots={(hotspots) => updateNodeData(hotspotEditorNode.id, { hotspots })}
                />
            )}

            <footer className="h-7 bg-stone-900 border-t border-stone-800 px-4 flex items-center justify-between text-[10px] text-stone-600">
                there are {state.nodes.length} nodes and {state.connections.length} connections. keep it up!!
            </footer>
        </div>
    );
}

