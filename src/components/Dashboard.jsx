import React, { useEffect, useState } from 'react';
import { supabase } from "../supabase";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { FaUsers, FaMoneyBill, FaChartLine, FaDog, FaWarehouse, FaPercentage } from 'react-icons/fa';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [kennels, setKennels] = useState([]);
  const [customerNamesById, setCustomerNamesById] = useState({}); // State to store customer names by ID

  useEffect(() => {
    const fetchData = async () => {
      let { data: analyticsData, error: analyticsError } = await supabase.from('analytics').select('*');
      if (analyticsError) console.log("Analytics data fetching error: ", analyticsError);
      else setData(analyticsData);

      let { data: customersData, error: customersError } = await supabase.from('customers').select('*');
      if (customersError) console.log("Customers data fetching error: ", customersError);
      else {
        setCustomers(customersData);
        const namesById = customersData.reduce((acc, customer) => {
          acc[customer.id] = customer.customer_name;
          return acc;
        }, {});
        setCustomerNamesById(namesById);
      }

      let { data: reservationsData, error: reservationsError } = await supabase.from('historical_reservations').select('*');
      if (reservationsError) console.log("Reservations data fetching error: ", reservationsError);
      else setReservations(reservationsData);

      let { data: kennelsData, error: kennelsError } = await supabase.from('kennels').select('*');
      if (kennelsError) console.log("Kennels data fetching error: ", kennelsError);
      else setKennels(kennelsData);
    };
    fetchData();
  }, []);

  // Customer Insights
  const totalCustomers = customers.length;
  const customerReservationFrequency = data.reduce((acc, curr) => {
    const customerName = customerNamesById[curr.customer_id];
    acc[customerName] = (acc[customerName] || 0) + 1;
    return acc;
  }, {});

  // Reservation Metrics
  const totalReservations = reservations.length;
  const reservationStatusBreakdown = reservations.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  const averageStayDuration = data.reduce((acc, curr) => acc + curr.days_stayed, 0) / data.length;
  const totalRevenue = data.reduce((acc, curr) => acc + curr.total_bill, 0);
  const averageRevenuePerReservation = totalRevenue / data.length;
  const revenueByMonth = data.reduce((acc, curr) => {
    const month = new Date(curr.created_at).getMonth();
    acc[month] = (acc[month] || 0) + curr.total_bill;
    return acc;
  }, Array(12).fill(0));

  // Pet Insights
  const popularBreeds = data.reduce((acc, curr) => {
    acc[curr.pet_breed] = (acc[curr.pet_breed] || 0) + 1;
    return acc;
  }, {});
  const petServicesUtilization = data.reduce((acc, curr) => {
    if (curr.pickup) acc.pickup = (acc.pickup || 0) + 1;
    if (curr.groom) acc.groom = (acc.groom || 0) + 1;
    if (curr.drop) acc.drop = (acc.drop || 0) + 1;
    return acc;
  }, {});

  // Kennel Utilization
  const totalKennels = kennels.length;
  const occupiedKennels = kennels.filter(kennel => kennel.status !== 'available').length;
  const occupancyRate = (occupiedKennels / totalKennels) * 100;
  const canceledReservations = reservations.filter(reservation => reservation.status === 'canceled').length;
  const cancellationRate = (canceledReservations / totalReservations) * 100;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Customer Insights */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Customer Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <div className="flex items-center mb-4">
              <FaUsers className="text-3xl text-blue-500 mr-4" />
              <p className="text-xl">Total Customers: {totalCustomers}</p>
            </div>
          </div>
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <h3 className="text-xl font-bold mb-2">Customer Reservation Frequency</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(customerReservationFrequency).map(([customerName, frequency]) => ({ customerName, frequency }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="customerName" label={{ value: 'Customer Name', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value, name) => [value, customerNamesById[name]]} />
                <Legend />
                <Bar dataKey="frequency" fill="#82ca9d" name="Reservation Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reservation Metrics */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Reservation Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <div className="mb-4">
              <FaChartLine className="text-3xl text-green-500 mr-4" />
              <p className="text-xl">Total Reservations: {totalReservations}</p>
            </div>
            <p className="text-xl">Average Stay Duration: {averageStayDuration.toFixed(2)} days</p>
            <p className="text-xl">Total Revenue: ₹{totalRevenue.toFixed(2)}</p>
            <p className="text-xl">Average Revenue per Reservation: ₹{averageRevenuePerReservation.toFixed(2)}</p>
          </div>
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <h3 className="text-xl font-bold mb-2">Reservation Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(reservationStatusBreakdown).map(([status, count]) => ({ name: status, value: count }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#82ca9d"
                  label
                >
                  {Object.entries(reservationStatusBreakdown).map(([status], index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#82ca9d" : "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="md:col-span-2 p-4 shadow-lg rounded-lg bg-white">
            <h3 className="text-xl font-bold mb-2">Revenue Trends (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByMonth.map((revenue, index) => ({ month: new Date(0, index).toLocaleString('default', { month: 'short' }), revenue }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', offset: 0 }}  />
                <Tooltip />
                <Legend />
                <Line type="monotone"
                dataKey="revenue"
                stroke="#82ca9d"
                name="Revenue"
              />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pet Insights */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Pet Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <h3 className="text-xl font-bold mb-2">Popular Pet Breeds</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(popularBreeds).map(([breed, count]) => ({ breed, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="breed" label={{ value: 'Breed', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <h3 className="text-xl font-bold mb-2">Pet Services Utilization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(petServicesUtilization).map(([service, count]) => ({ service, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="service" label={{ value: 'Service', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kennel Utilization */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Kennel Utilization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <div className="flex items-center mb-4">
              <FaWarehouse className="text-3xl text-red-500 mr-4" />
              <p className="text-xl">Occupancy Rate: {occupancyRate.toFixed(2)}%</p>
            </div>
          </div>
          <div className="p-4 shadow-lg rounded-lg bg-white">
            <div className="flex items-center mb-4">
              <FaPercentage className="text-3xl text-yellow-500 mr-4" />
              <p className="text-xl">Cancellation Rate: {cancellationRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
