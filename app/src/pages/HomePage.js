// src/pages/HomePage.js
import React from 'react';
import { Button } from '@magnetic/button'; // Assuming button styles are loaded globally or in App.js

const HomePage = () => {
  const handleClick = () => {
    alert('Magnetic Button Clicked from Home Page!');
  };

  return (
    <div>
      <h1>Welcome to the Home Page!</h1>
      <Button onClick={handleClick}>
        Click Me (Home Button)
      </Button>
      <p>
        This is the content specific to your home page.
      </p>
    </div>
  );
};

export default HomePage;