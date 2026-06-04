// App.jsx is the top-level component. It:
//   1. Fetches the data file on first load
//   2. Manages "global" state: search text, selected tags
//   3. Renders the header, filter controls, and the list of farm-season sections
//
// React mental model in three sentences:
//   - A "component" is a function that returns HTML-like markup (JSX)
//   - "State" is data the component remembers between renders (useState hook)
//   - When state changes, React re-runs the component function to update what shows on screen
import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import TagFilters, { matchesFilter } from './components/TagFilters';
import FarmSeasonSection from './components/FarmSeasonSection';
import TableOfContents from './components/TableOfContents';

export default function App() {
  // ---- State (things this component remembers) ----
  // `data` starts as null and gets filled in after the JSON file loads
  const [data, setData] = useState(null);
  // `loadError` holds any error message if the fetch fails
  const [loadError, setLoadError] = useState(null);
  // `searchText` is whatever the user typed into the search box
  const [searchText, setSearchText] = useState('');
  // `activeTags` is a Set of tag strings the user has clicked to filter by
  const [activeTags, setActiveTags] = useState(new Set());

  // ---- Side effect: fetch the data file once when the app loads ----
  // useEffect with [] (empty dependency array) means "run once on mount"
  useEffect(() => {
    fetch('/farm_season_data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setLoadError(err.message));
  }, []);

  // ---- Derived state: which farm-seasons match the current filters? ----
  // useMemo recomputes only when the dependencies change.
  // This prevents recomputing the filter on every keystroke if data is huge.
  const filteredFarmSeasons = useMemo(() => {
    if (!data) return [];
    const search = searchText.trim().toLowerCase();
    return data.farm_seasons.filter((fs) => {
      // Search: matches farm name or season string
      if (search) {
        const hay = `${fs.farm} ${fs.season}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      // Tags: AND-logic. Section must match every active filter.
      for (const tag of activeTags) {
        if (!matchesFilter(fs.tags, tag)) return false;
      }
      return true;
    });
  }, [data, searchText, activeTags]);

  // ---- Toggle a tag on/off when its button is clicked ----
  const toggleTag = (tag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearTags = () => setActiveTags(new Set());

  // ---- Render ----
  // Loading and error states first
  if (loadError) {
    return (
      <div className="p-8 text-red-700">
        Failed to load data: {loadError}
        <div className="mt-2 text-sm text-gray-600">
          Did you run <code>python scripts/export_data.py</code> first?
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="p-8 text-gray-600">Loading data…</div>;
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        nTotal={data.metadata.n_farm_seasons}
        nShowing={filteredFarmSeasons.length}
        nFarms={data.metadata.n_farms}
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <TagFilters
          activeTags={activeTags}
          onToggle={toggleTag}
          onClear={clearTags}
        />

        {/* Two-column layout: ToC on left (sticky), charts on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 mt-6">
          <aside className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <TableOfContents farmSeasons={filteredFarmSeasons} />
          </aside>

          <main className="space-y-8">
            {filteredFarmSeasons.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-gray-500">
                No farm-seasons match the current filters.
              </div>
            ) : (
              filteredFarmSeasons.map((fs) => (
                <FarmSeasonSection key={fs.id} farmSeason={fs} />
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
