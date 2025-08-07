import React, { useEffect, useMemo, useState } from 'react';
import { Info, Image as ImageIcon, MapPin, UploadCloud } from 'lucide-react';
import axios from 'axios';
import Constants from '@constants/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@store';
import SearchableDropdown from '@components/admin/SearchableDropdown';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';

type OptionType = {
    id: string;
    name: string;
}

interface CompanyFormData {
    companyName: string;
    email: string;
    phone: string;
    address: string;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string;
    siteLogo: File | null;
    favicon: File | null;
    companyLogo: File | null;
    fax: string;
    userId: string | null;
}

const InitialCompanyFormData: CompanyFormData = {
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: null,
    state: null,
    country: null,
    pincode: '',
    siteLogo: null,
    favicon: null,
    companyLogo: null,
    fax: '',
    userId: null
};
const CompanySettings: React.FC = () => {
    const [companyFormData, setCompanyFormData] = useState<CompanyFormData>(InitialCompanyFormData);
    //state for dropdown options
    const [countries, setCountries] = useState<OptionType[]>([]);
    const [states, setStates] = useState<OptionType[]>([]);
    const [cities, setCities] = useState<OptionType[]>([]);

    //state for dropdown search
    const [countryInput, setCountryInput] = useState<string>('');
    const [stateInput, setStateInput] = useState<string>('');
    const [cityInput, setCityInput] = useState<string>('');

    //state for loading indicators
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    
    //state for selected options
    const [selectedCountry, setSelectedCountry] = useState<OptionType | null>(null);
    const [selectedState, setSelectedState] = useState<OptionType | null>(null);
    const [selectedCity, setSelectedCity] = useState<OptionType | null>(null);

    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const { token, user } = useSelector((state: RootState) => state.auth);

    //update userid on mount
    useEffect(() => {
        setCompanyFormData(prev => ({ ...prev, userId: user.id }));
    }, [user]);

    useEffect(() => {
       fetchCompanySettings(); 
    },[]);

    const fetchCompanySettings = async () => {
        try {
            const response = await axios.get(`${Constants.FETCH_COMPANY_SETTINGS_URL}/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCompanyFormData(prev => ({
                ...prev,
                ...response.data.data,
                country : response.data.data.country ? response.data.data.country._id : null,
                state : response.data.data.state ? response.data.data.state._id : null,
                city : response.data.data.city ? response.data.data.city._id : null
            }));
            //if country available then set it
            if(response.data.data.country){
                const countryRes = await axios.get(`${Constants.FETCH_COUNTRY_URL}/${response.data.data.country._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const countryData = countryRes.data;
                const countryObject = { id: countryData._id, name: countryData.name };
                
                setSelectedCountry(countryObject);
            }
            //if state available then set it
            if(response.data.data.state){
                const stateRes = await axios.get(`${Constants.FETCH_STATE_URL}/${response.data.data.state._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const stateData = stateRes.data;
                const stateObject = { id: stateData._id, name: stateData.name };
                setSelectedState(stateObject);
            }
            //if city available then set it
            if(response.data.data.city){
                const cityRes = await axios.get(`${Constants.FETCH_CITY_URL}/${response.data.data.city._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const cityData = cityRes.data;
                const cityObject = { id: cityData._id, name: cityData.name };
                setSelectedCity(cityObject);
            }
        } catch (error) {
            console.error('Error fetching company settings:', error);
        }
    }
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCompanyFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleDropdownChange = (fieldName: 'country' | 'state' | 'city', value: OptionType | null) => {
        setCompanyFormData(prev => ({ ...prev, [fieldName]: value ? value.id : null }));

        if (fieldName === 'country') {
            setSelectedCountry(value);
            // Reset children when parent changes
            setSelectedState(null);
            setSelectedCity(null);
            setCompanyFormData(prev => ({ ...prev, state: null, city: null }));
            setStates([]);
            setCities([]);
        }
        if (fieldName === 'state') {
            setSelectedState(value);
            // Reset child when parent changes
            setSelectedCity(null);
            setCompanyFormData(prev => ({ ...prev, city: null }));
            setCities([]);
        }
        if (fieldName === 'city') {
            setSelectedCity(value);
        }
    };

    const fetchCountries = async (searchTerm?: string) => {
        try {
            setLoadingCountries(true);
            const response = await axios.get(Constants.FETCH_COUNTRIES_URL, {
                params: { search: searchTerm },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const transformedCountries = response.data.map((country: any) => ({
                id: String(country._id),
                name: country.name
            }));
            
            setCountries(transformedCountries);
        } catch (error) {
            console.error('Error fetching countries:', error);
        } finally {
            setLoadingCountries(false);
        }
    }

    const debouncedFetchCountries = useMemo(() => debounce(fetchCountries, 500), [token]);

    const fetchStates = async (countryId: string, searchTerm?: string) => {
        
        try {
            setLoadingStates(true);
            const response = await axios.get(`${Constants.FETCH_STATES_URL}/${countryId}`, {
                params: { search: searchTerm },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const transformedStates = response.data.map((state: any) => ({
                id: String(state._id),
                name: state.name
            }));
            setStates(transformedStates);
        } catch (error) {
            console.error('Error fetching states:', error);
        } finally {
            setLoadingStates(false);
        }
    }

    const fetchCities = async (stateId: string, searchTerm?: string) => {
        try {
            setLoadingCities(true);
            const response = await axios.get(`${Constants.FETCH_CITIES_URL}/${stateId}`, {
                params: { search: searchTerm },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const transformedCities = response.data.map((city: any) => ({
                id: String(city._id),
                name: city.name
            }));
            setCities(transformedCities);
        } catch (error) {
            console.error('Error fetching cities:', error);
        } finally {
            setLoadingCities(false);
        }
    };

    const debouncedFetchStates = useMemo(() => debounce(fetchStates, 500), [token]);
    const debouncedFetchCities = useMemo(() => debounce(fetchCities, 500), [token]);

    useEffect(() => {
        debouncedFetchCountries(countryInput);
        return () => debouncedFetchCountries.cancel();
    }, [countryInput, debouncedFetchCountries]);

    useEffect(() => {
        if (companyFormData.country) {
            debouncedFetchStates(String(companyFormData.country), stateInput);
        }
        return () => debouncedFetchStates.cancel();
    }, [companyFormData.country, stateInput, debouncedFetchStates]);

    useEffect(() => {
        if (companyFormData.state) {
            debouncedFetchCities(String(companyFormData.state), cityInput);
        }
        return () => debouncedFetchCities.cancel();
    }, [companyFormData.state, cityInput, debouncedFetchCities]);

    const validateCompanyForm = () => {
        const errors: { [key: string]: string } = {};

        if (!companyFormData.companyName) {
            errors.companyName = 'Company name is required';
        } else if (companyFormData.companyName.length < 3) {
            errors.companyName = 'Company name must be at least 3 characters';
        } else if (companyFormData.companyName.length > 50) {
            errors.companyName = 'Company name must be less than 50 characters';
        }

        // email
        if (!companyFormData.email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(companyFormData.email)) {
            errors.email = 'Email is invalid';
        }

        // phone
        if (!companyFormData.phone) {
            errors.phone = 'Phone is required';
        } else if (!phoneRegex.test(companyFormData.phone)) {
            errors.phone = 'Phone must be 10–15 digits';
        }

        // address
        if (!companyFormData.address) {
            errors.address = 'Address is required';
        }

        //pincode
        if (!companyFormData.pincode) {
            errors.pincode = 'Pincode is required';
        }
        
        //country
        if (!companyFormData.country) {
            errors.country = 'Country is required';
        }

        //state
        if (!companyFormData.state) {
            errors.state = 'State is required';
        }

        //city
        if (!companyFormData.city) {
            errors.city = 'City is required';
        }
        if(Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return false;
        }
        setFormErrors({});
        return true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!validateCompanyForm()) return;
        try {
            await axios.put(Constants.UPDATE_COMPANY_SETTINGS_URL+`/${companyFormData.userId}`, companyFormData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Company settings updated successfully');
        } catch (error) {
            console.error('Error updating company settings:', error);
            toast.error('Failed to update company settings');
        }
    }
    return (
        <div className="">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Company Settings</h1>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* General Information Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-3 mb-6">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md">
                            <Info size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        General Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={companyFormData.companyName}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full  dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-none"
                            />
                            {formErrors.companyName && <span className="text-red-500 text-xs">{formErrors.companyName}</span>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={companyFormData.email}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full  dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-none"
                            />
                            {formErrors.email && <span className="text-red-500 text-xs">{formErrors.email}</span>}
                        </div>
                        <div>
                            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                value={companyFormData.phone}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full  dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-none"
                            />
                            {formErrors.phone && <span className="text-red-500 text-xs">{formErrors.phone}</span>}
                        </div>
                        <div>
                            <label htmlFor="fax" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Fax
                            </label>
                            <input
                                type="text"
                                id="fax"
                                name="fax"
                                value={companyFormData.fax}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full  dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-none"
                            />
                            {formErrors.fax && <span className="text-red-500 text-xs">{formErrors.fax}</span>}
                        </div>
                    </div>
                </div>

                {/* Company Images Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-3 mb-6">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md">
                            <ImageIcon size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        Company Images
                    </h2>
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-white">Logo</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Upload icon of your Company</p>
                            </div>
                            <div className="text-right">
                                <button type="button" className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                    <UploadCloud size={16} className="mr-2" />
                                    Change Photo
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">Recommended size is 250 px * 100 px</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-white">Favicon</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Upload Logo of your company</p>
                            </div>
                            <div className="text-right">
                                <button type="button" className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                    <UploadCloud size={16} className="mr-2" />
                                    Change Photo
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">Recommended size is 250 px * 100 px</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b-0">
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-white">Company Icon</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Upload Logo of your company</p>
                            </div>
                            <div className="text-right">
                                <button type="button" className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                    <UploadCloud size={16} className="mr-2" />
                                    Change Photo
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">Recommended size is 250 px * 100 px</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-3 mb-6">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md">
                            <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        Address Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={companyFormData.address}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full  dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-none"
                            />
                            {formErrors.address && <span className="text-red-500 text-xs">{formErrors.address}</span>}
                        </div>
                        <div>
                            <SearchableDropdown
                                label='Country'
                                required
                                options={countries}
                                value={selectedCountry}
                                onInputChange={(e, value) => setCountryInput(value)}
                                onChange={(e, value) => handleDropdownChange('country', value)}
                                loading={loadingCountries}
                            />
                            {formErrors.country && <span className="text-red-500 text-xs">{formErrors.country}</span>}
                        </div>
                        <div>
                            <SearchableDropdown
                                label='State'
                                required
                                options={states}
                                value={selectedState}
                                onInputChange={(e, value) => setStateInput(value)}
                                onChange={(e, value) => handleDropdownChange('state', value)}
                                disabled={!companyFormData.country}
                                loading={loadingStates}
                            />
                            {formErrors.state && <span className="text-red-500 text-xs">{formErrors.state}</span>}
                        </div>
                        <div>
                            <SearchableDropdown
                                label='City'
                                required
                                options={cities}
                                value={selectedCity}
                                onInputChange={(e, value) => setCityInput(value)}
                                onChange={(e, value) => handleDropdownChange('city', value)}
                                disabled={!companyFormData.state} 
                                loading={loadingCities}
                            />
                            {formErrors.city && <span className="text-red-500 text-xs">{formErrors.city}</span>}
                        </div>
                        <div className='mt-1'>
                            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Postal Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="postalCode"
                                name="pincode"
                                value={companyFormData.pincode}
                                onChange={(e) => handleInputChange(e)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full  dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-none"
                            />
                            {formErrors.pincode && <span className="text-red-500 text-xs">{formErrors.pincode}</span>}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CompanySettings;