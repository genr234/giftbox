import type { GraphState } from "@/app/types";

export const generateCode = (state: GraphState) => {
    const scenes = state.nodes
        .filter(n => n.type !== 'start' && n.type !== 'end')
        .map(node => {
            const directConn = state.connections.find(c => c.from === node.id && !c.fromPort);

            const scene: any = {
                id: node.id,
                type: node.type,
                background: node.data.background || '/backgrounds/bedroom_day.png',
                transition: node.data.transition,
            };

            if (node.type === 'dialogue') {
                scene.dialogue = node.data.dialogue;
                if (directConn?.to && directConn.to !== 'end') {
                    scene.nextSceneId = directConn.to;
                }
            } else if (node.type === 'exploration') {
                scene.hint = node.data.hint;
                scene.hotspots = node.data.hotspots?.map(h => {
                    const conn = state.connections.find(c => c.from === node.id && c.fromPort === h.id);
                    return {
                        ...h,
                        onClickResult: conn?.to && conn.to !== 'end' ? conn.to : undefined,
                    };
                });
            }
            return scene;
        });

    const startConn = state.connections.find(c => c.from === 'start');
    return `// Starting scene: ${startConn?.to || 'none'}

const gameScenes: Scene[] = ${JSON.stringify(scenes, null, 2)};

export default gameScenes;`;
};