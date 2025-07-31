import { LogOut, User, Menu, Plus, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import type { RootState } from '../../../store';

interface HeaderProps {
    toggleSidebar: () => void;
}

const AdminHeader = ({ toggleSidebar }: HeaderProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const { user } = useSelector((state: RootState) => state.auth);
    return (
        <header className="flex items-center justify-between px-6 py-2 bg-white-500 shadow z-10">
            <div className="flex items-center">
                <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none cursor-pointer">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex items-center space-x-4">
                <button className="hidden md:flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition">
                    <Plus size={24} />
                </button>
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-full p-1"
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-full flex items-center justify-center text-lg font-semibold">
                            {user?.initials || <UserCircle className="w-6 h-6" />}
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <div
                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 transform origin-top-right animate-fade-in-up"
                            onMouseLeave={() => setIsDropdownOpen(false)}
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="user-menu-button"
                        >
                            <div className="px-4 py-3" role="none">
                                <p className="text-sm font-medium text-gray-900 truncate" role="none">
                                    {user?.name || "Guest User"}
                                </p>
                                <p className="text-sm text-gray-500 truncate" role="none">
                                    {user?.email || "guest@example.com"}
                                </p>
                            </div>
                            <div className="py-1" role="none">
                                <Link
                                    to="/admin/settings/account"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md mx-2 transition-colors duration-200"
                                    role="menuitem"
                                >
                                    <User className="w-4 h-4 mr-3 text-gray-400" />
                                    Profile
                                </Link>

                                <button
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md mx-2 transition-colors duration-200"
                                    role="menuitem"
                                >
                                    <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;