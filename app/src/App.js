import React from 'react';
import { Button } from '@magnetic/button'; // Import the Magnetic Button component
import '@magnetic/button/styles.css'; // Import the styles for the Button
import './App.css'; // Keep your existing App.css import if it exists

function App() {
  const handleClick = () => {
    alert('Magnetic Button Clicked!');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello Magnetic World!</h1>
        <Button onClick={handleClick}>
          Click Me (Magnetic Button)
        </Button>
        <p>
          This is a simple React app using the Magnetic Design System.
        </p>
      </header>
    </div>
  );
}

export default App;