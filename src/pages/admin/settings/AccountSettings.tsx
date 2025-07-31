import React, { useState, useEffect } from 'react';
import Constants from '../../../constants/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { toast } from 'react-toastify';
import type { AxiosError } from 'axios';
import axios from 'axios';

// --- Type Definitions ---

// Defines the structure for location data (countries, states, cities)
interface LocationItem {
    _id: string;
    name: string;
}

// Defines the structure of the user profile data from the API
interface ApiProfile {
    profileImage?: string;
    profileImageUrl?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: 'male' | 'female' | 'other' | '';
    dateOfBirth: string; // Stored as 'YYYY-MM-DD'
    address: string;
    country: number|string|null;
    state: number|string|null;
    city: number|string|null;
    postalCode: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
}
// Defines the structure of the profile state, including the local file object
interface Profile extends ApiProfile {
    profileImageFile?: File | null; // To hold the new image file for upload
}


// This component represents the Account Settings / Profile Update page.
const AccountSettings: React.FC = () => {
    // State to hold the user's profile data
    const [profile, setProfile] = useState<Profile | null>(null);
    // State to manage loading status of the profile data
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    // State to manage saving status when updating the profile
    const [savingProfile, setSavingProfile] = useState<boolean>(false);
    // State to hold the URL for the profile image preview
    const [profileImagePreview, setProfileImagePreview] = useState<string>('https://placehold.co/120x120/E0BBE4/FFFFFF?text=Profile');

    // States for location data (countries, states, cities)
    const [countries, setCountries] = useState<LocationItem[]>([]);
    const [states, setStates] = useState<LocationItem[]>([]);
    const [cities, setCities] = useState<LocationItem[]>([]);

    // Loading states for location data API calls
    const [loadingCountries, setLoadingCountries] = useState<boolean>(false);
    const [loadingStates, setLoadingStates] = useState<boolean>(false);
    const [loadingCities, setLoadingCities] = useState<boolean>(false);

    const { token } = useSelector((state: RootState) => state.auth);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    // Function to scroll to the top of the page smoothly
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- API call to fetch user profile data ---
    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoadingProfile(true);
            try {
                const response = await fetch(Constants.FETCH_USER_PROFILE_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json() as ApiProfile;

                const fetchedProfile: Profile = {
                    ...data,
                    profileImage: data.profileImage || '',
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
                };

                setProfile(fetchedProfile);
                if (fetchedProfile.profileImageUrl) {
                    setProfileImagePreview(fetchedProfile.profileImageUrl);
                }
            } catch (error) {
                toast.error('Failed to fetch user profile.');
                // Set a default profile if fetching fails
                setProfile({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    gender: '',
                    dateOfBirth: '',
                    address: '',
                    country: '',
                    state: '',
                    city: '',
                    postalCode: '',
                    profileImageFile: null
                });
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchUserProfile();
    }, [token]); // Rerun if token changes

    // --- API call to fetch countries ---
    useEffect(() => {
        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                const response = await fetch(Constants.FETCH_COUNTRIES_URL, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json() as LocationItem[];
                setCountries(data);
            } catch (error) {
                toast.error("Failed to fetch countries.");
                setCountries([]);
            } finally {
                setLoadingCountries(false);
            }
        };
        fetchCountries();
    }, [token]);

    // --- API call to fetch states based on selected country ---
    useEffect(() => {
        if (profile?.country) {
            const fetchStates = async () => {
                setLoadingStates(true);
                setStates([]);
                setCities([]);
                //set profile state and city to empty
                const currentProfile = { ...profile, state: '', city: '' };
                setProfile(currentProfile);
                try {
                    const response = await fetch(`${Constants.FETCH_STATES_URL}/${profile.country}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json() as LocationItem[];
                    setStates(data);
                } catch (error) {
                    toast.error(`Failed to load states for ${profile.country}.`);
                    setStates([]);
                } finally {
                    setLoadingStates(false);
                }
            };
            fetchStates();
        } else {
            setStates([]);
            setCities([]);
        }
    }, [profile?.country, token]);

    // --- API call to fetch cities based on selected state ---
    useEffect(() => {
        if (profile?.state) {
            const fetchCities = async () => {
                setLoadingCities(true);
                setCities([]);
                //set profile city to empty
                const currentProfile = { ...profile, city: '' };
                setProfile(currentProfile);
                try {
                    const response = await fetch(`${Constants.FETCH_CITIES_URL}/${profile.state}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json() as LocationItem[];
                    setCities(data);
                } catch (error) {
                    toast.error(`Failed to load cities for ${profile.state}.`);
                    setCities([]);
                } finally {
                    setLoadingCities(false);
                }
            };
            fetchCities();
        } else {
            setCities([]);
        }
    }, [profile?.state, token]);

    // Handler for input field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => prev ? { ...prev, [name]: value } : null);
    };

    // Handler for profile image file selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setProfile(prev => prev ? { ...prev, profileImageFile: file } : null);
        }
    };

    // Handler for form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!profile) return;

        setSavingProfile(true);

        try {
            const formData = new FormData();

            Object.keys(profile).forEach(key => {
                const formKey = key as keyof Profile;
                const value = profile[formKey];

                if (
                    formKey !== 'profileImage' &&
                    formKey !== 'profileImageFile' &&
                    formKey !== 'profileImageUrl'
                ) {
                    // Always append, even if value is empty string
                    formData.append(formKey, value !== undefined && value !== null ? String(value) : '');
                }
            });



            if (profile.profileImageFile) {
                formData.append('profileImage', profile.profileImageFile);
            }
            await axios.put(Constants.UPDATE_PROFILE_URL, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSavingProfile(false);
            setFormErrors({});      
            toast.success('Profile updated successfully.');
            scrollToTop();
        } catch (error) {
            const AxiosError = error as AxiosError<{ errors: FormErrors }>;
            if(AxiosError?.response?.data?.errors) setFormErrors(AxiosError.response.data.errors);
            setSavingProfile(false);
        }
    };

    // Show a loading spinner while the profile data is being fetched
    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                <p className="ml-4 text-gray-700 text-lg">Loading Profile...</p>
            </div>
        );
    }

    // Render the profile update form
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-6 md:p-8 shadow-2xl rounded-xl w-full">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">Account Settings</h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Information Section */}
                    <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            General Information
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center mb-8">
                            <img
                                src={profileImagePreview}
                                alt="Profile"
                                className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-purple-400 shadow-lg mb-4 sm:mb-0 sm:mr-6"
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "https://placehold.co/120x120/E0BBE4/FFFFFF?text=Profile";
                                }}
                            />
                            <div className="flex flex-col items-center sm:items-start">
                                <label htmlFor="profileImage" className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm py-2 px-4 rounded-md shadow-md transition duration-200 ease-in-out">
                                    Upload New Photo
                                    <input type="file" id="profileImage" name="profileImage" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                                <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">
                                    Recommended: 150×150px. JPG, PNG, or JPEG.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">First Name <span className="text-red-500">*</span></label>
                                <input type="text" id="firstName" name="firstName" value={profile.firstName || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" required />
                                {formErrors.firstName && <p className="text-red-500 text-xs mt-2">{formErrors.firstName}</p>}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">Last Name <span className="text-red-500">*</span></label>
                                <input type="text" id="lastName" name="lastName" value={profile.lastName || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" />
                                {formErrors.lastName && <p className="text-red-500 text-xs mt-2">{formErrors.lastName}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email <span className="text-red-500">*</span></label>
                                <input type="email" id="email" name="email" value={profile.email || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" required />
                                {formErrors.email && <p className="text-red-500 text-xs mt-2">{formErrors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Mobile Number <span className="text-red-500">*</span></label>
                                <input type="tel" id="phone" name="phone" value={profile.phone || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" required />
                                {formErrors.phone && <p className="text-red-500 text-xs mt-2">{formErrors.phone}</p>}
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-gray-700 text-sm font-bold mb-2">Gender</label>
                                <select id="gender" name="gender" value={profile.gender || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200">
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {formErrors.gender && <p className="text-red-500 text-xs mt-2">{formErrors.gender}</p>}
                            </div>
                            <div>
                                <label htmlFor="dateOfBirth" className="block text-gray-700 text-sm font-bold mb-2">Date of Birth</label>
                                <input type="date" id="dateOfBirth" name="dateOfBirth" value={profile.dateOfBirth || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" />
                                {formErrors.dateOfBirth && <p className="text-red-500 text-xs mt-2">{formErrors.dateOfBirth}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Address Information Section */}
                    <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Address Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Address <span className="text-red-500">*</span></label>
                                <input type="text" id="address" name="address" value={profile.address || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" required />
                                {formErrors.address && <p className="text-red-500 text-xs mt-2">{formErrors.address}</p>}
                            </div>
                            <div>
                                <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Country <span className="text-red-500">*</span></label>
                                <select id="country" name="country" value={profile.country || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" disabled={loadingCountries}>
                                    <option value="">{loadingCountries ? 'Loading...' : 'Select Country'}</option>
                                    {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                {formErrors.country && <p className="text-red-500 text-xs mt-2">{formErrors.country}</p>}
                            </div>
                            <div>
                                <label htmlFor="state" className="block text-gray-700 text-sm font-bold mb-2">State <span className="text-red-500">*</span></label>
                                <select id="state" name="state" value={profile.state || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" disabled={!profile.country || loadingStates}>
                                    <option value="">{loadingStates ? 'Loading...' : 'Select State'}</option>
                                    {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                {formErrors.state && <p className="text-red-500 text-xs mt-2">{formErrors.state}</p>}
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">City <span className="text-red-500">*</span></label>
                                <select id="city" name="city" value={profile.city || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" disabled={!profile.state || loadingCities}>
                                    <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                                    {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                {formErrors.city && <p className="text-red-500 text-xs mt-2">{formErrors.city}</p>}
                            </div>
                            <div>
                                <label htmlFor="postalCode" className="block text-gray-700 text-sm font-bold mb-2">Postal Code <span className="text-red-500">*</span></label>
                                <input type="text" id="postalCode" name="postalCode" value={profile.postalCode || ''} onChange={handleChange} className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200" required />
                                {formErrors.postalCode && <p className="text-red-500 text-xs mt-2">{formErrors.postalCode}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pt-4">
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full focus:outline-none focus:shadow-outline shadow-lg transform transition-all duration-200 ease-in-out hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed" disabled={savingProfile}>
                            {savingProfile ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent border-solid rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountSettings;
