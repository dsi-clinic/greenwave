// FarmSeasonSection renders one farm-season block.
// It shows the title, the section-level tags, and one PanelChart per
// (species, line) facet inside this farm-season.

import PanelChart from './PanelChart';

export default function FarmSeasonSection({ farmSeason }) {
  return (
    <section
      id={farmSeason.id}
      className="bg-white rounded-lg shadow p-6 scroll-mt-4"
    >
      {/* Section header */}
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h2 className="text-xl font-bold text-brand-navy">
          {farmSeason.farm} — {farmSeason.season}
        </h2>
        <div className="flex flex-wrap gap-1 mt-2">
          {farmSeason.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Grid of panels — 2 per row on big screens, 1 per row on phones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farmSeason.panels.map((panel, i) => (
          <PanelChart key={i} panel={panel} />
        ))}
      </div>
    </section>
  );
}
