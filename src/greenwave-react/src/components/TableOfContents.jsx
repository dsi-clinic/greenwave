// TableOfContents shows a list of farm-season links in the sidebar.
// Clicking one scrolls to that section.

export default function TableOfContents({ farmSeasons }) {
  if (farmSeasons.length === 0) return null;

  return (
    <nav className="bg-white rounded-lg shadow p-3 text-sm">
      <h2 className="font-semibold text-gray-800 mb-2 px-2">
        Farm-seasons ({farmSeasons.length})
      </h2>
      <ul className="space-y-0.5">
        {farmSeasons.map((fs) => (
          <li key={fs.id}>
            <a
              href={`#${fs.id}`}
              className="block px-2 py-1 rounded text-gray-700 hover:bg-emerald-50 hover:text-brand-darkGreen truncate"
            >
              {fs.farm} · {fs.season}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
