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
    hoverHint?: string;
    onClickResult?: string;
}

export interface Position {
    x: number;
    y: number;
}

export interface SceneNode {
    id: string;
    type: 'dialogue' | 'exploration' | 'start' | 'end';
    position: Position;
    data: {
        background?: string;
        dialogue?: DialogueLine;
        hotspots?: Hotspot[];
        hint?: string;
        transition?: 'fade' | 'fadeBlack' | 'instant';
    };
}

export interface Connection {
    id: string;
    from: string;
    to: string;
    fromPort?: string;
    label?: string;
}

export interface GraphState {
    nodes: SceneNode[];
    connections: Connection[];
    viewport: { x: number; y: number; zoom: number };
}

