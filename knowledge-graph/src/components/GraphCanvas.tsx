import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { SimulationNode, SimulationEdge } from '../types';
import { useGraphStore, newEdgeId } from '../store/useGraphStore';
import { t } from '../i18n';

interface Props {
  width: number;
  height: number;
}

/** Calculate bounding-box dimensions for any node shape, fully containing the label text */
function getNodeDims(label: string, size: number) {
  const charW = 7.5;
  const padX = 20; // 10px padding on each side
  const w = Math.max(label.length * charW + padX, 40);
  const h = Math.max(size, 28);
  return { w, h };
}

function getCollisionRadius(dims: { w: number; h: number }) {
  return Math.hypot(dims.w, dims.h) / 2 + 4;
}

/** Rounded rectangle path for all nodes */
function roundedRectPath(w: number, h: number, r = 8): string {
  r = Math.min(r, w / 2, h / 2);
  return `M ${-w / 2 + r},${-h / 2} h ${w - 2 * r} a ${r},${r} 0 0 1 ${r},${r} v ${h - 2 * r} a ${r},${r} 0 0 1 ${-r},${r} h ${-(w - 2 * r)} a ${r},${r} 0 0 1 ${-r},${-r} v ${-(h - 2 * r)} a ${r},${r} 0 0 1 ${r},${-r} z`;
}

/** Create a single node's SVG elements inside the given <g> wrapper */
function createNodeElements(gInner: d3.Selection<SVGGElement, SimulationNode, any, any>) {
  gInner.each(function (d) {
    const el = d3.select(this);
    const dims = getNodeDims(d.label, d.size || 32);
    const path = roundedRectPath(dims.w, dims.h);
    el.append('path')
      .attr('class', 'node-shape')
      .attr('d', path)
      .attr('fill', d.color)
      .attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('stroke-width', 1);
  });
  gInner.append('text')
    .text((d) => d.label)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#fff')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .style('pointer-events', 'none')
    .style('user-select', 'none');
}

export default function GraphCanvas({ width, height }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationEdge> | null>(null);
  const linkStartRef = useRef<string | null>(null);
  const mainGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodeGroupSelRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const linkGroupSelRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodeSelRef = useRef<d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown> | null>(null);
  const linkSelRef = useRef<d3.Selection<SVGGElement, SimulationEdge, SVGGElement, unknown> | null>(null);
  const simNodesRef = useRef<SimulationNode[]>([]);
  const simEdgesRef = useRef<SimulationEdge[]>([]);

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);
  const highlightedEdgeIds = useGraphStore((s) => s.highlightedEdgeIds);
  const filterGroups = useGraphStore((s) => s.filterGroups);
  const darkMode = useGraphStore((s) => s.darkMode);
  const pathNodeIds = useGraphStore((s) => s.pathNodeIds);
  const pathEdgeIds = useGraphStore((s) => s.pathEdgeIds);
  const pathMode = useGraphStore((s) => s.pathMode);
  const pathStartId = useGraphStore((s) => s.pathStartId);
  const linkingMode = useGraphStore((s) => s.linkingMode);
  const linkingSourceId = useGraphStore((s) => s.linkingSourceId);

  // Filter nodes/edges
  const filteredNodes = filterGroups.length > 0
    ? nodes.filter((n) => filterGroups.includes(n.group))
    : nodes;
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Version for sync effect — captures all structural and property changes
  const version = [
    filteredNodes.map(n => `${n.id}|${n.color}|${n.label}|${n.shape}|${n.size}`).join(','),
    filteredEdges.map(e => `${e.id}|${e.label}|${e.color}|${e.width}|${e.style}`).join(','),
    darkMode,
  ].join('__');

  // ============================================================
  // Effect 1: One-time setup — SVG, zoom, simulation, events
  // ============================================================
  useEffect(() => {
    if (!svgRef.current || width <= 0 || height <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Main group for zoom/pan
    const g = svg.append('g').attr('class', 'main-group');

    // Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        useGraphStore.getState().setZoom(Math.round(event.transform.k * 100));
      });
    svg.call(zoomBehavior);
    svg.on('dblclick.zoom', null);

    // Click background to deselect / exit path mode
    svg.on('click', (event) => {
      if (!(event.target as Element).closest('.node-group, .edge-group')) {
        useGraphStore.getState().setSelectedNodeId(null);
        useGraphStore.getState().setSelectedEdgeId(null);
        if (useGraphStore.getState().pathMode) {
          useGraphStore.getState().exitPathMode();
        }
      }
    });

    // Persistent SVG groups
    const linkGroup = g.append('g').attr('class', 'edges');
    const nodeGroup = g.append('g').attr('class', 'nodes');
    g.append('g').attr('class', 'ghost-layer');

    // Empty selections
    let nodeSel = nodeGroup.selectAll<SVGGElement, SimulationNode>('.node-group').data([]) as any as d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>;
    let linkSel = linkGroup.selectAll<SVGGElement, SimulationEdge>('.edge-group').data([]) as any as d3.Selection<SVGGElement, SimulationEdge, SVGGElement, unknown>;

    // --- Event delegation for nodes (works for dynamically added nodes) ---
    nodeGroup.on('click', function (event: MouseEvent) {
      const target = event.target as Element;
      const nodeEl = target.closest('.node-group') as SVGGElement | null;
      if (!nodeEl) return;
      const nodeData = d3.select<SVGGElement, SimulationNode>(nodeEl).datum();
      if (!nodeData) return;

      event.stopPropagation();
      const state = useGraphStore.getState();
      if (state.pathMode) { state.pickPathNode(nodeData.id); return; }
      if (state.linkingMode && state.linkingSourceId && nodeData.id !== state.linkingSourceId) {
        state.addEdge({
          id: newEdgeId(), source: state.linkingSourceId, target: nodeData.id,
          label: t('panel.node.defaultEdgeLabel'), color: '#999', width: 1.5, style: 'solid',
        });
        state.setLinkingMode(false);
        state.setSelectedNodeId(state.linkingSourceId);
        return;
      }
      state.setSelectedNodeId(nodeData.id);
    });

    // Shift+drag to connect
    nodeGroup.on('mousedown', function (event: MouseEvent) {
      if (!event.shiftKey) return;
      const nodeEl = (event.target as Element).closest('.node-group') as SVGGElement | null;
      if (!nodeEl) return;
      const nodeData = d3.select<SVGGElement, SimulationNode>(nodeEl).datum();
      if (nodeData) { event.stopPropagation(); linkStartRef.current = nodeData.id; }
    });
    nodeGroup.on('mouseup', function (event: MouseEvent) {
      if (!linkStartRef.current) return;
      const nodeEl = (event.target as Element).closest('.node-group') as SVGGElement | null;
      if (!nodeEl) return;
      const nodeData = d3.select<SVGGElement, SimulationNode>(nodeEl).datum();
      if (nodeData && linkStartRef.current !== nodeData.id) {
        useGraphStore.getState().addEdge({
          id: newEdgeId(), source: linkStartRef.current, target: nodeData.id,
          label: t('table.defaultEdge'), color: '#999', width: 1.5, style: 'solid',
        });
      }
      linkStartRef.current = null;
    });

    // Edge click delegation
    linkGroup.on('click', function (event: MouseEvent) {
      const edgeEl = (event.target as Element).closest('.edge-group') as SVGGElement | null;
      if (!edgeEl) return;
      const edgeData = d3.select<SVGGElement, SimulationEdge>(edgeEl).datum();
      if (edgeData) { event.stopPropagation(); useGraphStore.getState().setSelectedEdgeId(edgeData.id); }
    });

    // --- Drag behavior (applied per-node in sync effect) ---
    const dragBehavior = d3.drag<SVGGElement, SimulationNode>()
      .on('start', (event, d) => {
        if (event.sourceEvent?.shiftKey) return;
        if (!event.active) simulationRef.current?.alphaTarget(0.1).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => {
        if (event.sourceEvent?.shiftKey) return;
        d.fx = event.x; d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (event.sourceEvent?.shiftKey) return;
        if (!event.active) simulationRef.current?.alphaTarget(0);
        useGraphStore.getState().updateNode(d.id, { x: d.x, y: d.y });
        d.fx = null; d.fy = null;
      });

    // --- Force simulation (runs continuously) ---
    const maxRadial = Math.min(width, height) * 0.4;

    const simulation: d3.Simulation<SimulationNode, SimulationEdge> = d3.forceSimulation<SimulationNode>([])
      .alphaDecay(0.006)
      .velocityDecay(0.55)
      .force('radial', d3.forceRadial<SimulationNode>(
        (d) => {
          const deg = (d as any)._degree || 0;
          const maxDeg = (simulationRef.current as any)?._maxDegree || 1;
          return maxRadial * (1 - deg / (maxDeg + 2));
        },
        width / 2, height / 2
      ).strength(0.03))
      .force('charge', d3.forceManyBody<SimulationNode>().strength(-50))
      .force('collision', d3.forceCollide<SimulationNode>()
        .radius((d) => getCollisionRadius(getNodeDims(d.label, d.size || 32)))
        .strength(0.15)
        .iterations(1)
      )
      .force('link', d3.forceLink<SimulationNode, SimulationEdge>([])
        .id((d) => d.id)
        .distance((d) => {
          const s = typeof d.source === 'object'
            ? getCollisionRadius(getNodeDims((d.source as SimulationNode).label, (d.source as SimulationNode).size || 32)) : 28;
          const t = typeof d.target === 'object'
            ? getCollisionRadius(getNodeDims((d.target as SimulationNode).label, (d.target as SimulationNode).size || 32)) : 28;
          return s + t + 120;
        })
        .strength(0.05)
      )
      .force('centerX', d3.forceX(width / 2).strength(0.005))
      .force('centerY', d3.forceY(height / 2).strength(0.005))
      .on('tick', () => {
        if (linkSelRef.current) {
          linkSelRef.current.selectAll<SVGLineElement, SimulationEdge>('line')
            .attr('x1', (d) => (typeof d.source === 'object' ? (d.source as SimulationNode).x : 0))
            .attr('y1', (d) => (typeof d.source === 'object' ? (d.source as SimulationNode).y : 0))
            .attr('x2', (d) => (typeof d.target === 'object' ? (d.target as SimulationNode).x : 0))
            .attr('y2', (d) => (typeof d.target === 'object' ? (d.target as SimulationNode).y : 0));
          linkSelRef.current.select<SVGTextElement>('text')
            .attr('x', (d) => {
              const sx = typeof d.source === 'object' ? (d.source as SimulationNode).x : 0;
              const tx = typeof d.target === 'object' ? (d.target as SimulationNode).x : 0;
              return (sx + tx) / 2;
            })
            .attr('y', (d) => {
              const sy = typeof d.source === 'object' ? (d.source as SimulationNode).y : 0;
              const ty = typeof d.target === 'object' ? (d.target as SimulationNode).y : 0;
              return (sy + ty) / 2;
            });
        }
        if (nodeSelRef.current) {
          nodeSelRef.current.attr('transform', (d) => `translate(${d.x},${d.y})`);
        }
      });

    // Store refs
    simulationRef.current = simulation;
    mainGRef.current = g;
    nodeGroupSelRef.current = nodeGroup;
    linkGroupSelRef.current = linkGroup;
    nodeSelRef.current = nodeSel;
    linkSelRef.current = linkSel;
    (simulation as any)._dragBehavior = dragBehavior;

    return () => {
      simulation.stop();
      simulationRef.current = null;
      mainGRef.current = null;
      nodeGroupSelRef.current = null;
      linkGroupSelRef.current = null;
      nodeSelRef.current = null;
      linkSelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // Effect 2: Incremental sync — add/remove nodes & edges
  // ============================================================
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim || !nodeGroupSelRef.current || !linkGroupSelRef.current) return;

    const currentNodeIds = new Set(filteredNodes.map(n => n.id));
    const currentEdgeIds = new Set(filteredEdges.map(e => e.id));
    const prevNodeIds = new Set(simNodesRef.current.map(n => n.id));
    const prevEdgeIds = new Set(simEdgesRef.current.map(e => e.id));

    const addedNodeIds = new Set([...currentNodeIds].filter(id => !prevNodeIds.has(id)));
    const deletedNodeIds = new Set([...prevNodeIds].filter(id => !currentNodeIds.has(id)));
    const addedEdgeIds = new Set([...currentEdgeIds].filter(id => !prevEdgeIds.has(id)));
    const deletedEdgeIds = new Set([...prevEdgeIds].filter(id => !currentEdgeIds.has(id)));

    const isInitial = prevNodeIds.size === 0 && currentNodeIds.size > 0;

    // --- Save existing positions from simulation ---
    const posMap = new Map<string, { x: number; y: number }>();
    simNodesRef.current.forEach(n => posMap.set(n.id, { x: n.x, y: n.y }));

    // --- Build new simNodes, preserving positions ---
    const newSimNodes: SimulationNode[] = filteredNodes.map((n, i) => {
      const existing = posMap.get(n.id);
      if (existing) {
        return { ...n, x: existing.x, y: existing.y, vx: 0, vy: 0 };
      }
      const angle = (2 * Math.PI * i) / Math.max(1, filteredNodes.length);
      const initRadius = Math.min(width, height) * 0.3;
      return {
        ...n,
        x: width / 2 + initRadius * Math.cos(angle),
        y: height / 2 + initRadius * Math.sin(angle),
        vx: 0, vy: 0,
      };
    });

    const newSimEdges: SimulationEdge[] = filteredEdges.map(e => ({
      ...e, source: e.source, target: e.target,
    }));

    // --- Degree map ---
    const degreeMap: Record<string, number> = {};
    newSimNodes.forEach(n => { degreeMap[n.id] = 0; });
    newSimEdges.forEach(e => {
      const sid = typeof e.source === 'string' ? e.source : e.source.id;
      const tid = typeof e.target === 'string' ? e.target : e.target.id;
      degreeMap[sid] = (degreeMap[sid] || 0) + 1;
      degreeMap[tid] = (degreeMap[tid] || 0) + 1;
    });
    const maxDegree = Math.max(1, ...Object.values(degreeMap));
    (sim as any)._maxDegree = maxDegree;
    newSimNodes.forEach(n => { (n as any)._degree = degreeMap[n.id] || 0; });

    // ---- Fly-out animation for deleted nodes/edges ----
    const ghostLayer = mainGRef.current!.select('.ghost-layer');
    const oldNodeSel = nodeGroupSelRef.current.selectAll<SVGGElement, SimulationNode>('.node-group');
    const oldLinkSel = linkGroupSelRef.current.selectAll<SVGGElement, SimulationEdge>('.edge-group');

    if (deletedNodeIds.size > 0) {
      oldNodeSel.each(function (d) {
        if (deletedNodeIds.has(d.id)) {
          const transform = this.getAttribute('transform') || '';
          const ghost = ghostLayer.append('g').attr('class', 'fly-out').attr('transform', transform);
          this.querySelectorAll('.node-inner > *').forEach(
            child => ghost.node()!.appendChild(child.cloneNode(true))
          );
        }
      });
      requestAnimationFrame(() => {
        ghostLayer.selectAll('.fly-out').classed('fly-out-active' as any, true);
      });
    }

    if (deletedEdgeIds.size > 0) {
      oldLinkSel.each(function (d) {
        if (deletedEdgeIds.has(d.id)) {
          const ghost = ghostLayer.append('g').attr('class', 'fly-out');
          this.querySelectorAll('.edge-inner > *').forEach(
            child => ghost.node()!.appendChild(child.cloneNode(true))
          );
        }
      });
      if (deletedNodeIds.size === 0) {
        requestAnimationFrame(() => {
          ghostLayer.selectAll('.fly-out').classed('fly-out-active' as any, true);
        });
      }
    }

    if (deletedNodeIds.size > 0 || deletedEdgeIds.size > 0) {
      setTimeout(() => ghostLayer.selectAll('.fly-out').remove(), 700);
    }

    // ---- Incremental DOM update via D3 data join ----

    // Edges
    const linkSel = linkGroupSelRef.current
      .selectAll<SVGGElement, SimulationEdge>('.edge-group')
      .data(newSimEdges, (d: SimulationEdge) => d.id);

    linkSel.exit().remove();

    const linkEnter = linkSel.enter().append('g')
      .attr('class', 'edge-group')
      .style('cursor', 'pointer');
    const linkEnterInner = linkEnter.append('g').attr('class', 'edge-inner');
    // Invisible hit-area line (5x width for easier clicking)
    linkEnterInner.append('line')
      .attr('class', 'edge-hitarea')
      .attr('stroke', 'transparent')
      .attr('stroke-width', (d) => (d.width || 1.5) * 10);
    // Visible line
    linkEnterInner.append('line')
      .attr('class', 'edge-visible')
      .attr('stroke', (d) => d.color || '#999')
      .attr('stroke-width', (d) => d.width || 1.5)
      .attr('stroke-dasharray', (d) => {
        if (d.style === 'dashed') return '6,4';
        if (d.style === 'dotted') return '2,3';
        return null;
      })
      .style('pointer-events', 'none');
    linkEnterInner.append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => d.color || '#888')
      .attr('font-size', '11px')
      .attr('dy', -5)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Update existing edge visual properties
    linkSel.select('.edge-visible')
      .attr('stroke', (d) => d.color || '#999')
      .attr('stroke-width', (d) => d.width || 1.5);
    linkSel.select('.edge-hitarea')
      .attr('stroke-width', (d) => (d.width || 1.5) * 10);
    linkSel.select('text')
      .text((d) => d.label)
      .attr('fill', (d) => d.color || '#888');

    const mergedLinkSel = linkSel.merge(linkEnter);

    // Nodes
    const nodeSel = nodeGroupSelRef.current
      .selectAll<SVGGElement, SimulationNode>('.node-group')
      .data(newSimNodes, (d: SimulationNode) => d.id);

    nodeSel.exit().remove();

    const nodeEnter = nodeSel.enter().append('g')
      .attr('class', 'node-group')
      .style('cursor', 'grab');
    const nodeEnterInner = nodeEnter.append('g').attr('class', 'node-inner');
    createNodeElements(nodeEnterInner);

    // Update existing node visual properties
    nodeSel.each(function (d) {
      const el = d3.select(this).select('.node-inner');
      const dims = getNodeDims(d.label, d.size || 32);
      const path = roundedRectPath(dims.w, dims.h);
      el.select('.node-shape').attr('d', path).attr('fill', d.color);
      el.select('text').text(d.label);
    });

    const mergedNodeSel = nodeSel.merge(nodeEnter);

    // Apply drag to all current nodes (ensures initial + new nodes are draggable)
    if ((sim as any)._dragBehavior) {
      mergedNodeSel.call((sim as any)._dragBehavior);
    }

    // ---- Fly-in animation for new nodes ----
    if (addedNodeIds.size > 0 && !isInitial) {
      nodeEnter.select('.node-inner').attr('class', 'node-inner fly-in');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodeEnter.select('.node-inner').attr('class', 'node-inner fly-in fly-in-active');
        });
      });
      setTimeout(() => {
        nodeEnter.select('.node-inner').attr('class', 'node-inner');
      }, 800);
    }

    // ---- Update simulation data ----
    sim.nodes(newSimNodes);
    (sim.force('link') as d3.ForceLink<SimulationNode, SimulationEdge>)
      .links(newSimEdges);

    // Restart simulation
    const hasChanges = addedNodeIds.size > 0 || deletedNodeIds.size > 0
      || addedEdgeIds.size > 0 || deletedEdgeIds.size > 0;
    if (hasChanges || isInitial) {
      sim.alpha(isInitial ? 0.15 : 0.1).restart();
    }

    // Store refs for next sync
    simNodesRef.current = newSimNodes;
    simEdgesRef.current = newSimEdges;
    nodeSelRef.current = mergedNodeSel;
    linkSelRef.current = mergedLinkSel;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  // ============================================================
  // Effect 3: Selection / highlight / color / path updates
  // ============================================================
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const pathHas = pathNodeIds.size > 0;
    const searchHas = highlightedNodeIds.size > 0;

    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();
    if (selectedNodeId) {
      connectedNodeIds.add(selectedNodeId);
      edges.forEach((e) => {
        if (e.source === selectedNodeId || e.target === selectedNodeId) {
          connectedNodeIds.add(e.source);
          connectedNodeIds.add(e.target);
          connectedEdgeIds.add(e.id);
        }
      });
    }
    const hasSelection = connectedNodeIds.size > 0;

    svg.selectAll<SVGGElement, SimulationNode>('.node-group').each(function (d) {
      const gNode = d3.select(this);
      const isInPath = pathNodeIds.has(d.id);
      const isPathStart = d.id === pathStartId;
      const isInSearch = !searchHas || highlightedNodeIds.has(d.id);
      const isConnected = !hasSelection || connectedNodeIds.has(d.id);
      const isHighlighted = pathHas ? isInPath : (searchHas ? isInSearch : isConnected);
      const isSelected = d.id === selectedNodeId;
      const isLinkingTarget = linkingMode && linkingSourceId && d.id !== linkingSourceId;
      const opacity = isHighlighted ? 1 : 0.2;

      const currentNode = useGraphStore.getState().nodes.find(n => n.id === d.id);
      const color = currentNode?.color ?? d.color;

      gNode.select('.node-shape')
        .attr('opacity', opacity)
        .attr('fill', color)
        .attr('stroke', isPathStart
          ? '#F39C12'
          : isSelected
            ? '#FFD700'
            : isInPath
              ? '#FF9800'
              : isLinkingTarget
                ? '#4A90D9'
                : 'rgba(0,0,0,0.15)')
        .attr('stroke-width', isPathStart || isSelected || isInPath || isLinkingTarget ? 3 : 1)
        .attr('stroke-dasharray', isLinkingTarget ? '6,3' : 'none');

      gNode.select('text')
        .attr('opacity', isHighlighted ? 1 : 0.3);
    });

    const pathEdgeHas = pathEdgeIds.size > 0;
    const searchEdgeHas = highlightedEdgeIds.size > 0;

    svg.selectAll<SVGGElement, SimulationEdge>('.edge-group').each(function (d) {
      const gEdge = d3.select(this);
      const isInPath = pathEdgeIds.has(d.id);
      const isInSearch = !searchEdgeHas || highlightedEdgeIds.has(d.id);
      const isConnectedEdge = !hasSelection || connectedEdgeIds.has(d.id);
      const isHighlighted = pathHas || pathEdgeHas ? isInPath : (searchEdgeHas ? isInSearch : isConnectedEdge);
      const isSelected = d.id === selectedEdgeId;
      const opacity = isHighlighted ? 1 : 0.1;

      gEdge.select('.edge-visible')
        .attr('opacity', opacity)
        .attr('stroke', isInPath ? '#FF9800' : (d.color || '#999'))
        .attr('stroke-width', isInPath ? 3 : (isSelected ? 3 : (d.width || 1.5)));
      gEdge.select('text')
        .attr('opacity', isHighlighted ? 1 : 0.1)
        .attr('fill', isInPath ? '#FF9800' : (d.color || '#888'));
    });
  }, [selectedNodeId, selectedEdgeId, highlightedNodeIds, highlightedEdgeIds, nodes, edges, pathNodeIds, pathEdgeIds, pathStartId, pathMode, linkingMode, linkingSourceId]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: darkMode ? '#1a1a2e' : '#f8f6f0', display: 'block' }}
    />
  );
}
