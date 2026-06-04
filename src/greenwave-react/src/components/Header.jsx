// Header sits at the top of the page. Shows the title, summary stats,
// and the search box.
//
// "Props" are arguments passed from the parent component. Here we receive
// nTotal, nShowing, nFarms, searchText, and onSearchChange from App.

export default function Header({ nTotal, nShowing, nFarms, searchText, onSearchChange }) {
  return (
    <header className="bg-brand-navy text-white py-6 shadow">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold">
          GreenWave Farm-Season Plots
        </h1>
        <p className="text-sm text-emerald-200 mt-1">
          Showing {nShowing} of {nTotal} farm-seasons · {nFarms} farms total
        </p>

        {/* Search input. `onChange` fires every keystroke. */}
        <div className="mt-4 max-w-md">
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by farm or season (e.g. Farm_25, 23/24)…"
            className="w-full px-3 py-2 rounded bg-white text-gray-900 border-0
                       focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
      </div>
    </header>
  );
}
