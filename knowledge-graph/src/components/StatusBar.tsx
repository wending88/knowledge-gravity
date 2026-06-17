import { useGraphStore } from '../store/useGraphStore';
import { useT } from '../i18n';

export default function StatusBar() {
  const t = useT();
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const zoom = useGraphStore((s) => s.zoom);
  const darkMode = useGraphStore((s) => s.darkMode);

  const groups = [...new Set(nodes.map((n) => n.group).filter(Boolean))];

  return (
    <div className={`status-bar ${darkMode ? 'dark' : ''}`}>
      <span>N: {nodes.length}</span>
      <span>L: {edges.length}</span>
      <span>{t('status.groups', { count: groups.length })}</span>
      <span>{zoom}%</span>
    </div>
  );
}
