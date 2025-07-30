// This is the main page shown after a user logs in.
// It uses the Layout component to structure the page.

import { Briefcase, Calendar, Clock, BarChart, Users, FileText, ShoppingCart, Truck, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux'; // Import useSelector from react-redux
import type { RootState } from '../../store'; // Import RootState to type the Redux state

const DashboardPage: React.FC = () => {
  // Access the user object from the Redux store
  const user = useSelector((state: RootState) => state.auth.user);
  const [time, setTime] = useState<Date>(new Date()); // Explicitly type useState for Date

  useEffect(() => {
    // Set up an interval to update the time every minute
    const timer = setInterval(() => setTime(new Date()), 60000);
    
    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(timer);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Format the date for display
  const formattedDate: string = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format the time for display
  const formattedTime: string = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full font-sans"> {/* Added font-sans for consistency */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
      
      <div className="mt-6 p-6 bg-purple-600 text-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold">Good Morning, {user?.name || 'Guest'}</h2> {/* Use optional chaining and fallback */}
          <p className="mt-1">You have 9 invoices saved to draft that has to send to customers</p>
          <div className="flex items-center mt-4 text-sm opacity-90">
              <Calendar size={16} className="mr-2" />
              <span>{formattedDate}</span>
              <Clock size={16} className="ml-4 mr-2" />
              <span>{formattedTime}</span>
          </div>
      </div>

      <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
              <BarChart size={20} className="mr-3 text-gray-500" />
              Overview
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Invoice Card */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full mr-4"><FileText className="text-purple-600" /></div>
                  <div>
                      <p className="text-gray-500">Invoices</p>
                      <p className="text-2xl font-bold text-gray-800">13</p>
                  </div>
              </div>
              {/* Customers Card */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                  <div className="p-3 bg-green-100 rounded-full mr-4"><Users className="text-green-600" /></div>
                  <div>
                      <p className="text-gray-500">Customers</p>
                      <p className="text-2xl font-bold text-gray-800">4</p>
                  </div>
              </div>
              {/* Products Card */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full mr-4"><ShoppingCart className="text-blue-600" /></div>
                  <div>
                      <p className="text-gray-500">Products</p>
                      <p className="text-2xl font-bold text-gray-800">25</p>
                  </div>
              </div>
              {/* Suppliers Card */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full mr-4"><Truck className="text-yellow-600" /></div>
                  <div>
                      <p className="text-gray-500">Suppliers</p>
                      <p className="text-2xl font-bold text-gray-800">8</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default DashboardPage;
