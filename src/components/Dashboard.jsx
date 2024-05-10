import  { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { PieChart, Pie, Cell, BarChart, Bar, Tooltip, LineChart, Line, XAxis, YAxis, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import moment from 'moment';
import { HiDownload, HiCalendar } from 'react-icons/hi';
import { MdPets, MdHotel, MdRepeat } from 'react-icons/md';

const Dashboard = () => {
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [avgStayDuration, setAvgStayDuration] = useState(0);
  const [customerReturnRate, setCustomerReturnRate] = useState(0);
  const [monthlyOccupancyData, setMonthlyOccupancyData] = useState([]);
  const [yearlyOccupancyData, setYearlyOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true); // Loading indicator
  const [error, setError] = useState(null); // Error handling
  const [dateRange, setDateRange] = useState({ start: null, end: null }); // Custom date range filter

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true); // Start loading
        const { data: occupied } = await supabase
          .from("kennels")
          .select("status")
          .eq("status", "occupied");

        const { data: total } = await supabase.from("kennels").select("*");

        const { data: reservations } = await supabase.from("reservations").select("start_date, end_date");

        const totalDuration = reservations.reduce((acc, res) => {
          const start = new Date(res.start_date);
          const end = new Date(res.end_date);
          return acc + (end - start) / (1000 * 60 * 60 * 24); // Convert to days
        }, 0);

        const uniqueCustomers = new Set(reservations.map((res) => res.customer_name));

        // Calculate monthly and yearly occupancy rates
        const monthlyOccupancyRates = {};
        const yearlyOccupancyRates = {};
        reservations.forEach((res) => {
          const startDate = moment(res.start_date);
          const endDate = moment(res.end_date);
          const monthYear = startDate.format('YYYY-MM');
          const year = startDate.format('YYYY');

          const duration = endDate.diff(startDate, 'days');
          for (let i = 0; i <= duration; i++) {
            const currentDate = startDate.clone().add(i, 'days');
            const currentMonthYear = currentDate.format('YYYY-MM');
            const currentYear = currentDate.format('YYYY');

            monthlyOccupancyRates[currentMonthYear] = (monthlyOccupancyRates[currentMonthYear] || 0) + 1;
            yearlyOccupancyRates[currentYear] = (yearlyOccupancyRates[currentYear] || 0) + 1;
          }
        });

        const monthlyOccupancyData = Object.entries(monthlyOccupancyRates).map(([date, value]) => ({
          name: date,
          value: Math.round((value / total.length) * 100),
        }));

        const yearlyOccupancyData = Object.entries(yearlyOccupancyRates).map(([date, value]) => ({
          name: date,
          value: Math.round((value / total.length) * 100),
        }));

        setOccupancyRate(((occupied.length / total.length) * 100).toFixed(2));
        setAvgStayDuration((totalDuration / reservations.length).toFixed(2));
        setCustomerReturnRate(((uniqueCustomers.size / reservations.length) * 100).toFixed(2));
        setMonthlyOccupancyData(monthlyOccupancyData);
        setYearlyOccupancyData(yearlyOccupancyData);
      } catch (err) {
        setError(err.message); // Handle error
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchMetrics();
  }, []); // Run once on component mount

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
  };

  const filteredMonthlyOccupancyData = dateRange.start && dateRange.end
    ? monthlyOccupancyData.filter(data =>
        moment(data.name, 'YYYY-MM').isBetween(dateRange.start, dateRange.end, 'month', '[]')
      )
    : monthlyOccupancyData;

  const filteredYearlyOccupancyData = dateRange.start && dateRange.end
    ? yearlyOccupancyData.filter(data =>
        moment(data.name, 'YYYY').isBetween(moment(dateRange.start), moment(dateRange.end), 'year', '[]')
      )
    : yearlyOccupancyData;

  const handleExportData = () => {
    // Prepare the data for export
    const exportData = [
      ['Metric', 'Value'],
      ['Occupancy Rate', `${occupancyRate}%`],
      ['Average Stay Duration', `${avgStayDuration} days`],
      ['Customer Return Rate', `${customerReturnRate}%`],
      ...monthlyOccupancyData.map(({ name, value }) => [name, `${value}%`]),
      ...yearlyOccupancyData.map(({ name, value }) => [name, `${value}%`]),
    ];

    // Convert the data to CSV format
    const csvData = exportData.map(row => row.join(',')).join('\n');

    // Create a temporary link to download the CSV file
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`);
    downloadLink.setAttribute('download', 'dashboard_data.csv');
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);

    // Trigger the download
    downloadLink.click();

    // Remove the temporary link
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
            <div className="flex items-center">
              <div className="mr-4">
                <label htmlFor="dateRange" className="mr-2 text-gray-700 font-semibold">
                  <HiCalendar className="inline-block mb-1 text-gray-500" />
                  Select Date Range:
                </label>
                <input
                  type="date"
                  name="start"
                  id="start"
                  className="border border-gray-300 rounded-l-md py-1 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Start Date"
                  onChange={(e) => handleDateRangeChange(e.target.value, dateRange.end)}
                />
                <span className="mx-2 text-gray-500">to</span>
                <input
                  type="date"
                  name="end"
                  id="end"
                  className="border border-gray-300 rounded-r-md py-1 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="End Date"
                  onChange={(e) => handleDateRangeChange(dateRange.start, e.target.value)}
                />
              </div>
              <button
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                onClick={handleExportData}
              >
                <HiDownload className="mr-2" />
                Export Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Occupancy Rate Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MdHotel className="text-3xl text-blue-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-800">Occupancy Rate</h3>
                </div>
                <p className="text-4xl font-bold text-gray-800">{occupancyRate}%</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Occupied", value: occupancyRate },
                      { name: "Available", value: 100 - occupancyRate },
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    <Cell fill="#4299e1" /> {/* Color for occupied */}
                    <Cell fill="#e2e8f0" /> {/* Color for available */}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Average Stay Duration Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MdPets className="text-3xl text-green-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-800">Average Stay Duration</h3>
                </div>
                <p className="text-4xl font-bold text-gray-800">{avgStayDuration} days</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[{ name: "Avg Stay", value: avgStayDuration }]}>
                  <Line type="monotone" dataKey="value" stroke="#48bb78" strokeWidth={2} />
                  <XAxis dataKey="name" stroke="#718096" />
                  <YAxis stroke="#718096" />
                  <Tooltip />
                  <Legend />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Return Rate Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MdRepeat className="text-3xl text-yellow-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-800">Customer Return Rate</h3>
                </div>
                <p className="text-4xl font-bold text-gray-800">{customerReturnRate}%</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ name: "Return Rate", value: customerReturnRate }]}>
                  <Bar dataKey="value" fill="#f6ad55" />
                  <XAxis dataKey="name" stroke="#718096" />
                  <YAxis stroke="#718096" />
                  <Tooltip />
                  <Legend />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Monthly Occupancy Data */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Occupancy Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredMonthlyOccupancyData}>
                  <XAxis dataKey="name" stroke="#718096" />
                  <YAxis stroke="#718096" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#4299e1" strokeWidth={2} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Yearly Occupancy Data */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Yearly Occupancy Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredYearlyOccupancyData}>
                  <XAxis dataKey="name" stroke="#718096" />
                  <YAxis stroke="#718096" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#4299e1" strokeWidth={2} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;