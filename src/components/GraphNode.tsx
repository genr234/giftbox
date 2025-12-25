import React from 'react';
import { SceneNode, Connection } from '../app/types';


const NODE_WIDTH = 220;

interface GraphNodeProps {
    node: SceneNode;
    isSelected: boolean;
    connections: Connection[];
    onStartDrag: (e: React.MouseEvent) => void;
    onStartConnect: (e: React.MouseEvent, nodeId: string, port?: string) => void;
    onDrop: () => void;
}

export function GraphNode({ node, isSelected, connections, onStartDrag, onStartConnect, onDrop }: GraphNodeProps) {
    const typeColors = {
        start: 'border-green-500/60 bg-green-500/5',
        end: 'border-red-500/60 bg-red-500/5',
        dialogue: 'border-blue-500/60 bg-blue-500/5',
        exploration: 'border-emerald-500/60 bg-emerald-500/5',
    };

    const typeIcons = {
        start: '▶',
        end: '■',
        dialogue: '💬',
        exploration: '🔍',
    };

    const hasConnection = (port?: string) =>
        connections.some(c => c.from === node.id && c.fromPort === port);

    return (
        <div
            className={`absolute rounded-lg border-2 shadow-xl bg-stone-900 transition-all
        ${typeColors[node.type]}
        ${isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-950 z-10' : 'z-0'}
      `}
            style={{ left: node.position.x, top: node.position.y, width: NODE_WIDTH }}
            onMouseDown={onStartDrag}
            onMouseUp={onDrop}
        >
            {/* Header */}
            <div className="px-3 py-2 border-b border-stone-800 flex items-center gap-2">
                <span className="text-sm">{typeIcons[node.type]}</span>
                <span className="text-xs font-semibold truncate flex-1">{node.id}</span>
            </div>

            {/* Content */}
            <div className="p-3 text-xs text-stone-400">
                {node.type === 'start' && <span>Entry point</span>}
                {node.type === 'end' && <span>End point</span>}
                {node.type === 'dialogue' && (
                    <div className="line-clamp-2">
                        {node.data.dialogue?.speaker && (
                            <span className="text-amber-400">{node.data.dialogue.speaker}: </span>
                        )}
                        {node.data.dialogue?.text || 'No text...'}
                    </div>
                )}
                {node.type === 'exploration' && (
                    <div>
                        <div className="text-stone-500 mb-2">{node.data.hint || 'No hint...'}</div>
                        {node.data.hotspots && node.data.hotspots.length > 0 && (
                            <div className="space-y-1.5 mt-2 pt-2 border-t border-stone-800">
                                {node.data.hotspots.map(h => (
                                    <div key={h.id} className="flex items-center justify-between bg-stone-800/50 rounded px-2 py-1">
                                        <span className="truncate text-[10px] text-stone-300">{h.id}</span>
                                        <div
                                            className={`w-3 h-3 rounded-full cursor-crosshair transition-all
                        ${hasConnection(h.id) ? 'bg-emerald-400' : 'bg-amber-500 hover:scale-125'}
                      `}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                onStartConnect(e, node.id, h.id);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {(!node.data.hotspots || node.data.hotspots.length === 0) && (
                            <div className="text-stone-600 italic text-[10px]">No hotspots defined</div>
                        )}
                    </div>
                )}
            </div>

            {/* Input port */}
            {node.type !== 'start' && (
                <div
                    className="absolute -left-2 top-9 w-4 h-4 rounded-full bg-stone-700 border-2 border-stone-600
            hover:bg-stone-500 hover:border-stone-400 transition-colors"
                    onMouseUp={(e) => { e.stopPropagation(); onDrop(); }}
                />
            )}

            {/* Output port (for dialogue and start) */}
            {(node.type === 'dialogue' || node.type === 'start') && (
                <div
                    className={`absolute -right-2 top-9 w-4 h-4 rounded-full cursor-crosshair transition-all
            ${hasConnection() ? 'bg-emerald-400 border-emerald-300' : 'bg-amber-500 border-amber-400 hover:scale-125'}
            border-2
          `}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onStartConnect(e, node.id);
                    }}
                />
            )}
        </div>
    );
}
