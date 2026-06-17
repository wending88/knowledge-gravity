import type { GraphData } from '../types';

export const sampleData: GraphData = {
  nodes: [
    { id: 'n1', label: 'Artificial Intelligence', group: 'Core', color: '#4A90D9', size: 32, shape: 'rect', description: 'A branch of computer science' },
    { id: 'n2', label: 'Machine Learning', group: 'Technology', color: '#50C878', size: 32, shape: 'rect', description: 'Core technology of AI' },
    { id: 'n3', label: 'Deep Learning', group: 'Technology', color: '#50C878', size: 32, shape: 'rect', description: 'ML method based on neural networks' },
    { id: 'n4', label: 'Natural Language Processing', group: 'Application', color: '#FF7F50', size: 32, shape: 'rect', description: 'Enabling computers to understand human language' },
    { id: 'n5', label: 'Computer Vision', group: 'Application', color: '#FF7F50', size: 32, shape: 'rect', description: 'Enabling computers to understand images and video' },
    { id: 'n6', label: 'Neural Network', group: 'Model', color: '#9B59B6', size: 32, shape: 'rect', description: 'Computational model inspired by the human brain' },
    { id: 'n7', label: 'CNN', group: 'Model', color: '#9B59B6', size: 32, shape: 'rect', description: 'Neural network for image processing' },
    { id: 'n8', label: 'Transformer', group: 'Model', color: '#9B59B6', size: 32, shape: 'rect', description: 'Attention-based architecture' },
    { id: 'n9', label: 'ChatGPT', group: 'Product', color: '#E74C3C', size: 32, shape: 'rect', description: 'Large language model by OpenAI' },
    { id: 'n10', label: 'Data Science', group: 'Related', color: '#95A5A6', size: 32, shape: 'rect', description: 'Extracting knowledge from data' },
    { id: 'n11', label: 'Reinforcement Learning', group: 'Technology', color: '#50C878', size: 32, shape: 'rect', description: 'Learning strategies through reward signals' },
    { id: 'n12', label: 'Knowledge Graph', group: 'Application', color: '#FF7F50', size: 32, shape: 'rect', description: 'Structured representation of knowledge' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', label: 'includes', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e2', source: 'n2', target: 'n3', label: 'evolved', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e3', source: 'n1', target: 'n4', label: 'applied to', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e4', source: 'n1', target: 'n5', label: 'applied to', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e5', source: 'n3', target: 'n6', label: 'based on', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e6', source: 'n6', target: 'n7', label: 'type of', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e7', source: 'n6', target: 'n8', label: 'type of', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e8', source: 'n8', target: 'n9', label: 'powers', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e9', source: 'n1', target: 'n10', label: 'related to', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e10', source: 'n2', target: 'n11', label: 'includes', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e11', source: 'n7', target: 'n5', label: 'used in', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e12', source: 'n8', target: 'n4', label: 'used in', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e13', source: 'n1', target: 'n12', label: 'applied to', color: '#999', width: 1.5, style: 'solid' },
    { id: 'e14', source: 'n3', target: 'n11', label: 'related to', color: '#999', width: 1.5, style: 'solid' },
  ],
  metadata: {
    name: 'AI Knowledge Graph Sample',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
};
