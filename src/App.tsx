import { CityMap } from "./components/CityMap/CityMap";
import type { CityWithPerceptions } from "./types";
import "./App.css";

function App() {
  const handleCitySelect = (city: CityWithPerceptions) => {
    console.log("Selected city:", city);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-title">City Population Perception Map</h1>
        <p className="app-description">
          Explore how people perceive city populations around the world and
          compare their estimates with actual numbers.
        </p>
      </header>

      <main className="app-content">
        <CityMap onCitySelect={handleCitySelect} />
      </main>
    </div>
  );
}

export default App;
