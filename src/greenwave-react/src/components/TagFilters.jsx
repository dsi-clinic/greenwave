// TagFilters shows clickable tag buttons grouped by category.
// Clicking a tag toggles whether it's "active" (part of the AND-filter).
//
// Most tags are matched literally against the farm-season's tag list,
// but some buttons represent BUCKETS (like "5+samples") that match any
// tag matching a pattern. The bucket logic is in `matchesBucket` below.

const TAG_GROUPS = [
  { label: 'Samples',  tags: ['5+samples', '4-samples', '3-samples', '2-samples', '1-sample', '0-samples'] },
  { label: 'Harvests', tags: ['2+harvests', '1-harvest', '0-harvests'] },
  { label: 'Line info', tags: ['line-specified', 'multi-line', 'no-line'] },
  { label: 'Other',    tags: ['multi-species', 'has-both', 'no-pre-harvest-sample'] },
];

// Returns true if the farm-season's tag list satisfies the given filter tag.
// For exact-match tags, this is just a `.includes()`. For bucket tags like
// "5+samples", it matches any of N-samples where N >= 5.
export function matchesFilter(fsTags, filterTag) {
  if (filterTag === '5+samples') {
    return fsTags.some((t) => {
      const m = t.match(/^(\d+)-samples?$/);
      return m && parseInt(m[1], 10) >= 5;
    });
  }
  if (filterTag === '2+harvests') {
    return fsTags.some((t) => {
      const m = t.match(/^(\d+)-harvests?$/);
      return m && parseInt(m[1], 10) >= 2;
    });
  }
  return fsTags.includes(filterTag);
}

export default function TagFilters({ activeTags, onToggle, onClear }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-semibold text-gray-800">Filter by tag:</span>

        {TAG_GROUPS.map((group) => (
          <div key={group.label} className="flex items-baseline gap-1">
            <span className="text-xs text-gray-500 mr-1">{group.label}:</span>
            {group.tags.map((tag) => {
              const isActive = activeTags.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggle(tag)}
                  className={`text-xs px-2 py-1 rounded border transition ${
                    isActive
                      ? 'bg-brand-green text-white border-brand-green'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        ))}

        {activeTags.size > 0 && (
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 ml-2 rounded text-gray-500 hover:text-gray-800"
          >
            × clear
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 italic mt-2">
        A farm-season matches if at least one of its plots has the tag.
        Multiple tags use AND-logic (a farm-season must match every selected tag).
      </p>
    </div>
  );
}
