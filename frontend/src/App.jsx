import React from "react";
import Routes from "./Routes";
import { AirQualityProvider } from "./context/AirQualityContext";

function App() {
  return (
    <AirQualityProvider>
      <Routes />
    </AirQualityProvider>
  );
}

export default App;
