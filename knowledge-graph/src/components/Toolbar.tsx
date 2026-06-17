import { useGraphStore } from '../store/useGraphStore';
import { useI18nStore, useT } from '../i18n';

interface Props {
  onToggleTableView: () => void;
  onImport: () => void;
  onExportJSON: () => void;
}

export default function Toolbar({
  onToggleTableView,
  onImport,
  onExportJSON,
}: Props) {
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const toggleDarkMode = useGraphStore((s) => s.toggleDarkMode);
  const darkMode = useGraphStore((s) => s.darkMode);
  const loadSampleData = useGraphStore((s) => s.loadSampleData);
  const clearGraph = useGraphStore((s) => s.clearGraph);
  const zoom = useGraphStore((s) => s.zoom);
  const nodes = useGraphStore((s) => s.nodes);
  const filterGroups = useGraphStore((s) => s.filterGroups);
  const setFilterGroups = useGraphStore((s) => s.setFilterGroups);
  const pathMode = useGraphStore((s) => s.pathMode);
  const togglePathMode = useGraphStore((s) => s.togglePathMode);
  const pathStartId = useGraphStore((s) => s.pathStartId);
  const pathNodeIds = useGraphStore((s) => s.pathNodeIds);
  const exitPathMode = useGraphStore((s) => s.exitPathMode);

  const { lang, setLang } = useI18nStore();
  const t = useT();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      const { nodes: allNodes } = useGraphStore.getState();
      const matched = allNodes.filter((n) => {
        const q = value.toLowerCase();
        return (
          n.label.toLowerCase().includes(q) ||
          n.group.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
        );
      });
      useGraphStore.getState().setHighlightedNodeIds(new Set(matched.map((n) => n.id)));
      const matchedIds = new Set(matched.map((n) => n.id));
      const { edges } = useGraphStore.getState();
      const connEdges = edges.filter(
        (e) => matchedIds.has(e.source) || matchedIds.has(e.target)
      );
      useGraphStore.getState().setHighlightedEdgeIds(new Set(connEdges.map((e) => e.id)));
    } else {
      useGraphStore.getState().setHighlightedNodeIds(new Set());
      useGraphStore.getState().setHighlightedEdgeIds(new Set());
    }
  };

  const groups = [...new Set(nodes.map((n) => n.group).filter(Boolean))];

  const toggleGroup = (g: string) => {
    if (filterGroups.includes(g)) {
      setFilterGroups(filterGroups.filter((x) => x !== g));
    } else {
      setFilterGroups([...filterGroups, g]);
    }
  };

  return (
    <div className={`toolbar ${darkMode ? 'dark' : ''}`}>
      <div className="toolbar-left">
        <span className="logo">KG</span>
        <div className="separator" />
        <button
          onClick={() => {
            if (window.confirm(t('toolbar.new.confirm'))) {
              clearGraph();
            }
          }}
          title={t('toolbar.new.title')}
        >
          {t('toolbar.new')}
        </button>
        <div className="separator" />
        <button onClick={onImport} title={t('toolbar.import.title')}>{t('toolbar.import')}</button>
        <button onClick={onExportJSON} title={t('toolbar.export.title')}>{t('toolbar.export')}</button>
        <div className="separator" />
        <button onClick={onToggleTableView} title={t('toolbar.table.title')}>{t('toolbar.table')}</button>
        <button onClick={loadSampleData} title={t('toolbar.sample.title')}>{t('toolbar.sample')}</button>
        <div className="separator" />
        <button
          className={pathMode ? 'active' : ''}
          onClick={pathMode ? exitPathMode : togglePathMode}
          title={t('toolbar.path.title')}
        >
          {t('toolbar.path')}{pathMode ? (pathStartId ? t('toolbar.path.selectEnd') : t('toolbar.path.selectStart')) : ''}
        </button>
      </div>
      <div className="toolbar-center">
        <input
          type="text"
          placeholder={t('toolbar.search')}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="toolbar-right">
        {pathMode && pathNodeIds.size > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {t('toolbar.pathLength', { count: pathNodeIds.size })}
          </span>
        )}
        <span className="zoom-display">{zoom}%</span>
        <button onClick={toggleDarkMode} title={t('toolbar.theme.title')}>
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          title={t('toolbar.language')}
          style={{ fontSize: 12, fontWeight: 600, padding: '2px 6px' }}
        >
          {lang === 'zh' ? 'EN' : '中'}
        </button>
      </div>
      {groups.length > 0 && (
        <div className="group-filters" style={{ width: '100%' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginRight: 4 }}>{t('toolbar.groupFilter')}</span>
          {groups.map((g) => (
            <button
              key={g}
              className={`group-tag ${filterGroups.includes(g) ? 'active' : ''}`}
              onClick={() => toggleGroup(g)}
            >
              {g}
            </button>
          ))}
          {filterGroups.length > 0 && (
            <button
              className="group-tag clear"
              onClick={() => setFilterGroups([])}
            >
              {t('toolbar.clearFilter')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
