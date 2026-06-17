import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GraphNode, GraphEdge, GraphData } from '../types';
import { sampleData } from '../utils/sampleData';
import { v4 as uuid } from 'uuid';
import { t } from '../i18n';

interface GraphStore {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphData['metadata'];

  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  searchQuery: string;
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  darkMode: boolean;
  filterGroups: string[];
  zoom: number;

  // Path mode (find shortest path between two nodes)
  pathMode: boolean;
  pathStartId: string | null;
  pathNodeIds: Set<string>;
  pathEdgeIds: Set<string>;

  // Linking mode (click canvas to pick edge target)
  linkingMode: boolean;
  linkingSourceId: string | null;

  // Node actions
  addNode: (node: GraphNode) => void;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  deleteNode: (id: string) => void;

  // Edge actions
  addEdge: (edge: GraphEdge) => void;
  updateEdge: (id: string, updates: Partial<GraphEdge>) => void;
  deleteEdge: (id: string) => void;

  // Selection
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;

  // Search & highlight
  setSearchQuery: (query: string) => void;
  setHighlightedNodeIds: (ids: Set<string>) => void;
  setHighlightedEdgeIds: (ids: Set<string>) => void;

  // Import/export
  importData: (data: GraphData) => void;
  importNodes: (nodes: GraphNode[]) => void;
  importEdges: (edges: GraphEdge[]) => void;
  exportData: () => GraphData;
  loadSampleData: () => void;
  clearGraph: () => void;

  // Theme
  toggleDarkMode: () => void;

  // Filter
  setFilterGroups: (groups: string[]) => void;

  // Zoom
  setZoom: (zoom: number) => void;

  // Path mode actions
  togglePathMode: () => void;
  exitPathMode: () => void;
  pickPathNode: (id: string) => void;

  // Linking mode actions
  setLinkingMode: (active: boolean, sourceId?: string | null) => void;

  // Helpers
  getGroups: () => string[];
  getConnectedNodes: (nodeId: string) => string[];
  findShortestPath: (startId: string, endId: string) => string[];
}

const newNodeId = () => `n_${uuid()}`;
const newEdgeId = () => `e_${uuid()}`;

export const useGraphStore = create<GraphStore>()(
  persist(
    (set, get) => ({
      nodes: sampleData.nodes,
      edges: sampleData.edges,
      metadata: sampleData.metadata,
      selectedNodeId: null,
      selectedEdgeId: null,
      searchQuery: '',
      highlightedNodeIds: new Set<string>(),
      highlightedEdgeIds: new Set<string>(),
      darkMode: false,
      filterGroups: [],
      zoom: 100,

      pathMode: false,
      pathStartId: null,
      pathNodeIds: new Set<string>(),
      pathEdgeIds: new Set<string>(),

      linkingMode: false,
      linkingSourceId: null,

      addNode: (node) => set((s) => ({
        nodes: [...s.nodes, node],
        metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
      })),

      updateNode: (id, updates) => set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
      })),

      deleteNode: (id) => set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
        pathStartId: s.pathStartId === id ? null : s.pathStartId,
        pathNodeIds: new Set([...s.pathNodeIds].filter((nid) => nid !== id)),
        metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
      })),

      addEdge: (edge) => set((s) => ({
        edges: [...s.edges, edge],
        metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
      })),

      updateEdge: (id, updates) => set((s) => ({
        edges: s.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
      })),

      deleteEdge: (id) => set((s) => ({
        edges: s.edges.filter((e) => e.id !== id),
        selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
        pathEdgeIds: new Set([...s.pathEdgeIds].filter((eid) => eid !== id)),
        metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
      })),

      setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setHighlightedNodeIds: (ids) => set({ highlightedNodeIds: ids }),
      setHighlightedEdgeIds: (ids) => set({ highlightedEdgeIds: ids }),

      importData: (data) => set({
        nodes: data.nodes,
        edges: data.edges,
        metadata: data.metadata,
        selectedNodeId: null,
        selectedEdgeId: null,
        pathMode: false,
        pathStartId: null,
        pathNodeIds: new Set<string>(),
        pathEdgeIds: new Set<string>(),
        filterGroups: [],
      }),

      clearGraph: () => set({
        nodes: [],
        edges: [],
        metadata: {
          name: t('app.unnamedCanvas'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        selectedNodeId: null,
        selectedEdgeId: null,
        searchQuery: '',
        highlightedNodeIds: new Set<string>(),
        highlightedEdgeIds: new Set<string>(),
        pathMode: false,
        pathStartId: null,
        pathNodeIds: new Set<string>(),
        pathEdgeIds: new Set<string>(),
        filterGroups: [],
        linkingMode: false,
        linkingSourceId: null,
      }),

      importNodes: (nodes) => set((s) => {
        // Merge by id: incoming wins for existing, new ids are added
        const map = new Map(s.nodes.map((n) => [n.id, n]));
        for (const n of nodes) map.set(n.id, n);
        return {
          nodes: [...map.values()],
          metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
        };
      }),

      importEdges: (edges) => set((s) => {
        const map = new Map(s.edges.map((e) => [e.id, e]));
        for (const e of edges) map.set(e.id, e);
        const validIds = new Set(s.nodes.map((n) => n.id));
        return {
          edges: [...map.values()].filter(
            (e) => validIds.has(e.source) && validIds.has(e.target)
          ),
          metadata: { ...s.metadata, updatedAt: new Date().toISOString() },
        };
      }),

      exportData: () => {
        const { nodes, edges, metadata } = get();
        return { nodes, edges, metadata };
      },

      loadSampleData: () => set({
        nodes: sampleData.nodes,
        edges: sampleData.edges,
        metadata: { ...sampleData.metadata, updatedAt: new Date().toISOString() },
        selectedNodeId: null,
        selectedEdgeId: null,
        pathMode: false,
        pathStartId: null,
        pathNodeIds: new Set<string>(),
        pathEdgeIds: new Set<string>(),
        filterGroups: [],
      }),

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      setFilterGroups: (groups) => set({ filterGroups: groups }),

      setZoom: (zoom) => set({ zoom }),

      togglePathMode: () => set((s) => ({
        pathMode: !s.pathMode,
        pathStartId: null,
        pathNodeIds: new Set<string>(),
        pathEdgeIds: new Set<string>(),
      })),

      exitPathMode: () => set({
        pathMode: false,
        pathStartId: null,
        pathNodeIds: new Set<string>(),
        pathEdgeIds: new Set<string>(),
      }),

      pickPathNode: (id) => {
        const state = get();
        if (!state.pathStartId) {
          set({ pathStartId: id });
          return;
        }
        if (state.pathStartId === id) {
          // Clicking the same node cancels the start
          set({ pathStartId: null, pathNodeIds: new Set(), pathEdgeIds: new Set() });
          return;
        }
        const pathNodes = state.findShortestPath(state.pathStartId, id);
        if (pathNodes.length === 0) {
          alert(t('store.noPathFound'));
          return;
        }
        // Compute the edge ids along the path
        const pathNodeSet = new Set(pathNodes);
        const pathEdges = state.edges
          .filter((e) => pathNodeSet.has(e.source) && pathNodeSet.has(e.target))
          .filter((e) => {
            // Only edges where consecutive nodes appear in path order
            const i1 = pathNodes.indexOf(e.source);
            const i2 = pathNodes.indexOf(e.target);
            return Math.abs(i1 - i2) === 1;
          })
          .map((e) => e.id);
        set({
          pathNodeIds: new Set(pathNodes),
          pathEdgeIds: new Set(pathEdges),
        });
      },

      setLinkingMode: (active, sourceId = null) => set({
        linkingMode: active,
        linkingSourceId: sourceId,
      }),

      getGroups: () => {
        const { nodes } = get();
        return [...new Set(nodes.map((n) => n.group).filter(Boolean))];
      },

      getConnectedNodes: (nodeId) => {
        const { edges } = get();
        const connected = new Set<string>();
        edges.forEach((e) => {
          if (e.source === nodeId) connected.add(e.target);
          if (e.target === nodeId) connected.add(e.source);
        });
        return [...connected];
      },

      findShortestPath: (startId, endId) => {
        const { nodes, edges } = get();
        const adj: Record<string, string[]> = {};
        nodes.forEach((n) => { adj[n.id] = []; });
        edges.forEach((e) => {
          adj[e.source]?.push(e.target);
          adj[e.target]?.push(e.source);
        });

        const queue = [startId];
        const visited = new Set([startId]);
        const prev: Record<string, string> = {};

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (current === endId) {
            const path: string[] = [];
            let node: string | undefined = endId;
            while (node) {
              path.unshift(node);
              node = prev[node];
            }
            return path;
          }
          for (const neighbor of adj[current] || []) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              prev[neighbor] = current;
              queue.push(neighbor);
            }
          }
        }
        return [];
      },
    }),
    {
      name: 'knowledge-graph-store',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        metadata: state.metadata,
        darkMode: state.darkMode,
      }),
    }
  )
);

export { newNodeId, newEdgeId };
