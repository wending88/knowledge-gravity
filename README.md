**[English](README.md)** | **[中文](README.zh-CN.md)**

# Knowledge Gravity

A browser-based knowledge graph visualization tool with force-directed layout, real-time editing, and JSON import/export.

## Live Demo

👉 [Open App](https://wwendyng.github.io/knowledge-gravity/)

## Features

- **Create Nodes**: Click the `+` button at the bottom-right corner to add nodes
- **Edit Properties**: Click any node or edge to modify its name, color, size, etc. in the side panel
- **Add Connections**: Select a node, click "Add Connection", then pick a target node to create a relationship
- **Drag Layout**: Drag nodes to reposition; the force-directed layout adjusts automatically
- **Search & Highlight**: Use the top search bar to find and highlight nodes by name, group, or description
- **Path Finding**: Enable path mode, click start and end nodes to calculate the shortest path
- **Import / Export**: Import and export graph data in JSON format
- **i18n**: Switch between Chinese and English with the language button in the top-right corner
- **Dark Mode**: Toggle light/dark theme with the theme button in the top-right corner

## Tech Stack

React + TypeScript + Vite + D3.js + Zustand
