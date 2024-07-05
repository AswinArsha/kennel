import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import KennelGrid from "./components/KennelGrid";
import ReservationForm from "./components/ReservationForm";
import ReservationList from "./components/ReservationList";
import FeedingSchedule from "./components/FeedingSchedule";
import FeedingLogHistory from "./components/FeedingLogHistory";
import CustomerManagement from "./components/CustomerManagement";
import Dashboard from "./components/Dashboard";
import CalendarView from "./components/CalendarView"; // Import the new CalendarView component

const App = () => {
  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-4 overflow-y-auto">
          <Routes>
            <Route path="/" element={<KennelGrid />} />
            <Route path="/make-reservation" element={<ReservationForm />} />
            <Route path="/reservation-list" element={<ReservationList />} />
            <Route path="/feeding-schedule" element={<FeedingSchedule />} />
            <Route path="/feeding-log-history" element={<FeedingLogHistory />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarView />} /> {/* New route for CalendarView */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
