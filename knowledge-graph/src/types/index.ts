export type NodeShape = 'circle' | 'rect' | 'diamond' | 'triangle';
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  color: string;
  size: number;
  shape: NodeShape;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  description: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  color: string;
  width: number;
  style: EdgeStyle;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    name: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SimulationNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface SimulationEdge extends Omit<GraphEdge, 'source' | 'target'> {
  source: SimulationNode | string;
  target: SimulationNode | string;
}
