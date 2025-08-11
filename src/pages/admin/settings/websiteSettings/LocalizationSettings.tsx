import SearchableDropdown from '@components/admin/SearchableDropdown';
import Constants from '@constants/api';
import type { RootState } from '@store/index';
import axios from 'axios';
import { Settings2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

type OptionType = {
    id: string;
    name: string;
};

interface DateFormat extends OptionType {
    format: string;
    title: string;
}

interface TimeFormat extends OptionType {
    format: string;
}

interface TimeZone extends OptionType {
    offset: string;
}

interface WeekDay extends OptionType {
    value: string;
}

// Static weekdays array
const WEEKDAYS: WeekDay[] = [
    { id: 'Sunday', name: 'Sunday', value: 'Sunday' },
    { id: 'Monday', name: 'Monday', value: 'Monday' },
    { id: 'Tuesday', name: 'Tuesday', value: 'Tuesday' },
    { id: 'Wednesday', name: 'Wednesday', value: 'Wednesday' },
    { id: 'Thursday', name: 'Thursday', value: 'Thursday' },
    { id: 'Friday', name: 'Friday', value: 'Friday' },
    { id: 'Saturday', name: 'Saturday', value: 'Saturday' },
];
const LocalizationSettings: React.FC = () => {
    const [dateFormats, setDateFormats] = useState<DateFormat[]>([]);
    const [timeFormats, setTimeFormats] = useState<TimeFormat[]>([]);
    const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Selected values
    const [selectedTimeZone, setSelectedTimeZone] = useState<OptionType | null>(null);
    const [selectedWeekDay, setSelectedWeekDay] = useState<OptionType | null>(null);
    const [selectedDateFormat, setSelectedDateFormat] = useState<OptionType | null>(null);
    const [selectedTimeFormat, setSelectedTimeFormat] = useState<OptionType | null>(null);

    const { token } = useSelector((state: RootState) => state.auth);
    
    useEffect(() => {
        fetchLocalizations();
    }, []);

    const fetchLocalizations = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(Constants.FETCH_LOCALIZATION_DROPDOWNS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const { dateFormats, timeFormats, timezones, settings } = response.data.data;
            
            if (dateFormats){
                setDateFormats(dateFormats.map(df => ({
                    ...df,
                    name: df.title || df.format
                })));
            }
            setTimeFormats(timeFormats);
            setTimeZones(timezones);
            
            // Set current settings if available
            if (settings) {
                const { timezone, startWeek, dateFormat, timeFormat } = settings;
                // Find and format the selected date format
                const formattedDateFormat = dateFormats.find(df => df.id === dateFormat.id);
                const dateFormatWithName = formattedDateFormat ? {
                    ...formattedDateFormat,
                    name: formattedDateFormat.title || formattedDateFormat.format
                } : null;
                
                setSelectedTimeZone(timezones.find(tz => tz.id === timezone.id) || null);
                setSelectedWeekDay(WEEKDAYS.find(day => day.id === startWeek) || null);
                setSelectedDateFormat(dateFormatWithName);
                setSelectedTimeFormat(timeFormats.find(tf => tf.id === timeFormat.id) || null);
            }
        } catch (error) {
            console.error('Error fetching localizations:', error);
            toast.error('Failed to load localization settings');
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleSaveSettings = async () => {
        if (!selectedTimeZone || !selectedWeekDay || !selectedDateFormat || !selectedTimeFormat) {
            toast.error('Please fill all required fields');
            return;
        }
        
        setIsSaving(true);
        try {
            await axios.post(Constants.UPDATE_LOCALIZATION_URL, {
                timezoneId: selectedTimeZone.id,
                startWeek: selectedWeekDay.id,
                dateFormatId: selectedDateFormat.id,
                timeFormatId: selectedTimeFormat.id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            toast.success('Localization settings updated successfully');
        } catch (error) {
            console.error('Error updating localization settings:', error);
            toast.error('Failed to update localization settings');
        } finally {
            setIsSaving(false);
        }
    }
    const labelClassName = "text-sm font-medium text-gray-800 dark:text-gray-200";
    const requiredSpan = <span className="text-red-500 ml-1">*</span>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Localization</h2>
            <hr className="my-6 border-gray-200 dark:border-gray-700" />

            <div className="space-y-10">
                {/* Section Basic Information */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <Settings2 size={22} className="text-indigo-600 dark:text-indigo-400" />
                        Basic Information
                    </h3>
                    <div className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <label htmlFor="timezone" className={`${labelClassName} md:mt-2`}>Time Zone {requiredSpan}</label>
                            <div className="md:col-span-2">
                                <SearchableDropdown
                                    options={timeZones}
                                    value={selectedTimeZone}
                                    placeholder="Select Time Zone"
                                    onChange={(_, value) => setSelectedTimeZone(value)}
                                    disabled={isLoading}
                                    required
                                />
                                {selectedTimeZone && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Offset: {(timeZones.find(tz => tz.id === selectedTimeZone.id) as TimeZone)?.offset}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <label htmlFor="start-week-on" className={`${labelClassName} md:mt-2`}>Start Week On {requiredSpan}</label>
                            <div className="md:col-span-2">
                                <SearchableDropdown
                                    options={WEEKDAYS}
                                    value={selectedWeekDay}
                                    placeholder="Select Start Day of Week"
                                    onChange={(_, value) => setSelectedWeekDay(value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <label htmlFor="date-format" className={`${labelClassName} md:mt-2`}>Date Format {requiredSpan}</label>
                            <div className="md:col-span-2">
                                <SearchableDropdown
                                    options={dateFormats}
                                    value={selectedDateFormat}
                                    placeholder="Select Date Format"
                                    onChange={(_, value) => setSelectedDateFormat(value)}
                                    disabled={isLoading}
                                    required
                                />
                                {selectedDateFormat && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Format: {(selectedDateFormat as DateFormat).format} ({(selectedDateFormat as DateFormat).title})
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <label htmlFor="time-format" className={`${labelClassName} md:mt-2`}>Time Format {requiredSpan}</label>
                            <div className="md:col-span-2">
                                <SearchableDropdown
                                    options={timeFormats}
                                    value={selectedTimeFormat}
                                    placeholder="Select Time Format"
                                    onChange={(_, value) => setSelectedTimeFormat(value)}
                                    disabled={isLoading}
                                    required
                                />
                                {selectedTimeFormat && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Format: {(timeFormats.find(tf => tf.id === selectedTimeFormat.id) as TimeFormat)?.format}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                {/* Form Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2"
                        disabled={isLoading || isSaving}
                    >
                        <X size={16} /> Cancel
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        onClick={handleSaveSettings}
                        disabled={isLoading || isSaving || !selectedTimeZone || !selectedWeekDay || !selectedDateFormat || !selectedTimeFormat}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LocalizationSettings;