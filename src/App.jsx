function SearchBox() {
  return (
    <div className="flex">
      <input
        type="text"
        placeholder="Look up definitions..."
        className="shadow-claude w-xs rounded-2xl border border-gray-200 px-4 py-4 text-base text-gray-700 transition-colors hover:border-gray-300 sm:w-lg"
      />
    </div>
  );
}

function App() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center">
        <SearchBox />
      </div>
    </>
  );
}

export default App;
