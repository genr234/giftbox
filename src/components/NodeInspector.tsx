import React from 'react';
import type { SceneNode, Connection } from '../app/types';
import { Field } from './Field';

interface NodeInspectorProps {
    node: SceneNode;
    connections: Connection[];
    availableSceneIds: string[];
    onUpdateData: (updates: Partial<SceneNode['data']>) => void;
    onRename: (newId: string) => void;
    onOpenHotspotEditor: () => void;
    onUpdateConnection: (fromPort: string | undefined, toId: string | null) => void;
}

export function NodeInspector({
                           node,
                           connections,
                           availableSceneIds,
                           onUpdateData,
                           onRename,
                           onOpenHotspotEditor,
                           onUpdateConnection,
                       }: NodeInspectorProps) {
    if (node.type === 'start' || node.type === 'end') {
        return (
            <div className="text-sm text-stone-500 italic">
                {node.type === 'start'
                    ? 'Connect this to your first scene.'
                    : 'This marks an ending point.'}
            </div>
        );
    }

    const directConnection = connections.find(c => c.from === node.id && !c.fromPort);

    return (
        <div className="space-y-5">
            <Field label="scene ID">
                <input
                    type="text"
                    value={node.id}
                    onChange={(e) => onRename(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm
            focus:border-amber-500/50 focus:outline-none transition-colors"
                />
            </Field>

            <Field label="background Image">
                <input
                    type="text"
                    value={node.data.background || ''}
                    onChange={(e) => onUpdateData({ background: e.target.value })}
                    placeholder="/backgrounds/bedroom_day.png"
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm
            focus:border-amber-500/50 focus:outline-none"
                />
                {node.data.background && (
                    <div className="mt-2 rounded overflow-hidden border border-stone-800">
                        <img
                            src={node.data.background}
                            alt="Preview"
                            className="w-full h-24 object-cover"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                    </div>
                )}
            </Field>

            <Field label="transition">
                <select
                    value={node.data.transition || 'fade'}
                    onChange={(e) => onUpdateData({ transition: e.target.value as any })}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm"
                >
                    <option value="fade">Fade</option>
                    <option value="fadeBlack">Fade to Black</option>
                    <option value="instant">Instant</option>
                </select>
            </Field>

            {node.type === 'dialogue' && (
                <>
                    <Field label="speaker">
                        <input
                            type="text"
                            value={node.data.dialogue?.speaker || ''}
                            onChange={(e) => onUpdateData({
                                dialogue: { ...node.data.dialogue!, speaker: e.target.value }
                            })}
                            placeholder="name"
                            className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm"
                        />
                    </Field>

                    <Field label="speaker Color">
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={node.data.dialogue?.speakerColor || '#fcd34d'}
                                onChange={(e) => onUpdateData({
                                    dialogue: { ...node.data.dialogue!, speakerColor: e.target.value }
                                })}
                                className="w-12 h-9 bg-stone-950 border border-stone-800 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={node.data.dialogue?.speakerColor || '#fcd34d'}
                                onChange={(e) => onUpdateData({
                                    dialogue: { ...node.data.dialogue!, speakerColor: e.target.value }
                                })}
                                className="flex-1 bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </Field>

                    <Field label="dialogue">
            <textarea
                value={node.data.dialogue?.text || ''}
                onChange={(e) => onUpdateData({
                    dialogue: { ...node.data.dialogue!, text: e.target.value }
                })}
                rows={4}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm resize-none"
            />
                    </Field>

                    <Field label="next scene">
                        <select
                            value={directConnection?.to || ''}
                            onChange={(e) => onUpdateConnection(undefined, e.target.value || null)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm"
                        >
                            <option value="">— None —</option>
                            {availableSceneIds.filter(id => id !== node.id).map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    </Field>
                </>
            )}

            {node.type === 'exploration' && (
                <>
                    <Field label="hint">
                        <input
                            type="text"
                            value={node.data.hint || ''}
                            onChange={(e) => onUpdateData({ hint: e.target.value })}
                            placeholder="look around..."
                            className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-sm"
                        />
                    </Field>

                    <Field label="hotspots">
                        <button
                            onClick={onOpenHotspotEditor}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium
                transition-colors flex items-center justify-center gap-2"
                        >
                            <span>hotspot editor</span>
                        </button>

                        {node.data.hotspots && node.data.hotspots.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {node.data.hotspots.map((h, i) => {
                                    const conn = connections.find(c => c.from === node.id && c.fromPort === h.id);
                                    return (
                                        <div key={h.id} className="bg-stone-950 border border-stone-800 rounded p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-stone-300">{h.id}</span>
                                                <button
                                                    onClick={() => {
                                                        const updated = node.data.hotspots!.filter((_, idx) => idx !== i);
                                                        onUpdateData({ hotspots: updated });
                                                    }}
                                                    className="text-stone-600 hover:text-red-400 text-sm"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-stone-500">
                                                Position: ({h.x.toFixed(1)}%, {h.y.toFixed(1)}%) •
                                                Size: {h.width.toFixed(1)}×{h.height.toFixed(1)}%
                                            </div>
                                            <select
                                                value={conn?.to || ''}
                                                onChange={(e) => onUpdateConnection(h.id, e.target.value || null)}
                                                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs"
                                            >
                                                <option value="">→ No connection</option>
                                                {availableSceneIds.filter(id => id !== node.id).map(id => (
                                                    <option key={id} value={id}>→ {id}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </Field>
                </>
            )}
        </div>
    );
}