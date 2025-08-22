import { useCallback } from 'react';
import dagre from 'dagre';

export const useDagreLayout = () => {
  const applyLayout = useCallback((nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: 100,
      ranksep: 100,
    });

    nodes.forEach((node) => {
      const height = 80 + (node.data.attributes?.length || 0) * 10;
      dagreGraph.setNode(node.id, { width: 250, height });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const height = 80 + (node.data.attributes?.length || 0) * 10;
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 125,
          y: nodeWithPosition.y - height / 2,
        }
      };
    });
  }, []);

  return applyLayout;
};