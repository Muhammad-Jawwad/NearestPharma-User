import React from 'react';
import './App.css'; // Include global styles
import MedicalRecommendationForm from './MedicalRecommendationForm';
import ToastContainer from './toast/ToastContainer';

function App() {
  return (
    <div className="App">
      <MedicalRecommendationForm />
      <ToastContainer />
    </div>
  );
}

export default App;
