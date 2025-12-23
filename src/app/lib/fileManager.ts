import type { GraphState } from '../types';

export const saveGraph = (state: GraphState) => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene-graph.json';
    a.click();
    URL.revokeObjectURL(url);
};

export const loadGraph = (file: File): Promise<GraphState> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const result = reader.result as string;
                const data = JSON.parse(result) as GraphState;
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => {
            reject(reader.error);
        };
        reader.readAsText(file);
    })
};