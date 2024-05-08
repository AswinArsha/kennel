import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import KennelGrid from './components/KennelGrid';
import ReservationForm from './components/ReservationForm';
import ReservationList from './components/ReservationList';
import FeedingSchedule from './components/FeedingSchedule'; // New Feeding Schedule component
import FeedingLogHistory from './components/FeedingLogHistory'; // New Feeding Log History component

const App = () => {
  return (
    <Router>
      <div className="flex h-screen">
        {/* Sidebar for navigation */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 p-4">
          <Routes>
            {/* Route for KennelGrid */}
            <Route path="/" element={<KennelGrid />} />
            
            {/* Route for the ReservationForm */}
            <Route path="/make-reservation" element={<ReservationForm />} />
            
            {/* Route for the ReservationList */}
            <Route path="/reservation-list" element={<ReservationList />} />

            {/* Route for Feeding Schedule Tracker */}
            <Route path="/feeding-schedule" element={<FeedingSchedule />} />

            {/* Route for Feeding Log History */}
            <Route path="/feeding-log-history" element={<FeedingLogHistory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
