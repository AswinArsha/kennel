import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../supabase";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CalendarDetailDialog from "./CalendarDetailDialog";

const CalendarView = () => {
  const [reservations, setReservations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCustomerDetailDialogOpen, setIsCustomerDetailDialogOpen] = useState(false);
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id, 
        pet_name, 
        pet_breed,
        start_date, 
        end_date, 
        status,
        customers (
          customer_name
        )
      `);

    if (error) {
      console.error("Error fetching reservations:", error.message);
    } else {
      const events = data.map((reservation) => {
        const endDate = new Date(reservation.end_date);
        endDate.setDate(endDate.getDate() + 1); // Adjust the end date by one day

        return {
          id: reservation.id,
          title: reservation.pet_name,
          start: reservation.start_date,
          end: endDate.toISOString().split('T')[0], // Format the date to YYYY-MM-DD
          extendedProps: {
            status: reservation.status,
            petBreed: reservation.pet_breed,
            customerName: reservation.customers.customer_name
          },
          classNames: getEventClassNames(reservation.status)
        };
      });
      setReservations(events);
    }
  };

  const getEventClassNames = (status) => {
    switch (status) {
      case 'checkin':
        return 'bg-green-500 text-white';
      case 'reserved':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-200 text-black';
    }
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setIsCustomerDetailDialogOpen(true);
  };

  const handleEventDrop = async (info) => {
    const { event } = info;
    try {
      const newStartDate = new Date(Date.UTC(event.start.getFullYear(), event.start.getMonth(), event.start.getDate()));
      const newEndDate = new Date(Date.UTC(event.end.getFullYear(), event.end.getMonth(), event.end.getDate(), 23, 59, 59, 999));

      await supabase
        .from('reservations')
        .update({
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString()
        })
        .eq('id', event.id);

      fetchReservations(); // Refresh the events
    } catch (error) {
      console.error('Error updating reservation:', error);
      info.revert();
    }
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const filteredEvents = reservations.filter(event => {
    const searchTerm = filter.search.toLowerCase();
    return (filter.status === 'all' || event.extendedProps.status === filter.status) &&
           (filter.search === '' || 
            event.title.toLowerCase().includes(searchTerm) ||
            event.extendedProps.petBreed.toLowerCase().includes(searchTerm) ||
            event.extendedProps.customerName.toLowerCase().includes(searchTerm));
  });

  const handleDateClick = (info) => {
    navigate(`/make-reservation?start_date=${info.dateStr}`);
  };

  return (
    <div className="p-6 bg-white h-screen flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <h2 className="text-2xl font-semibold mb-6">Reservation Calendar</h2>
      
      <div className="mb-4 flex space-x-4">
        <select 
          name="status" 
          onChange={handleFilterChange} 
          className="border rounded p-2"
        >
          <option value="all">All Statuses</option>
          <option value="checkin">Check in</option>
          <option value="reserved">Reserved</option>
        </select>
        <input 
          type="text" 
          name="search" 
          placeholder="Search Pet, Breed, or Customer" 
          onChange={handleFilterChange}
          className="border rounded p-2 flex-grow"
        />
      </div>

      <div className="flex-grow">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '' // Remove the month, week, and day options
          }}
          events={filteredEvents}
          eventClick={handleEventClick}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          dateClick={handleDateClick}
          eventContent={(arg) => (
            <div className={`text-sm p-1 pl-2 ${arg.event.classNames.join(' ')}`}>
              {arg.event.title}
            </div>
          )}
          height="auto" // Ensures the calendar uses the available height
        />
      </div>

      {isCustomerDetailDialogOpen && (
        <CalendarDetailDialog
          isOpen={isCustomerDetailDialogOpen}
          onClose={() => setIsCustomerDetailDialogOpen(false)}
          customer={selectedEvent}
        />
      )}

      <div className="mt-6 flex space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span>Check in</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
          <span>Reserved</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
