import { Settings2, CircleDollarSign } from 'lucide-react';

const LocalizationSettings: React.FC = () => {
    // Shared classes for form elements to maintain consistency
    const selectClassName = "w-full max-w-xs rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
    const readOnlyInputClassName = "w-full max-w-xs rounded-md bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 py-2 px-3 sm:text-sm cursor-not-allowed";
    const labelClassName = "text-sm font-medium text-gray-800 dark:text-gray-200";
    const requiredSpan = <span className="text-red-500 ml-1">*</span>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Localization</h2>
            <hr className="my-6 border-gray-200 dark:border-gray-700"/>

            <div className="space-y-10">
                {/* Section Basic Information */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <Settings2 size={22} className="text-indigo-600 dark:text-indigo-400"/> 
                        Basic Information
                    </h3>
                    <div className="space-y-5">
                        <div className="flex justify-between items-center">
                            <label htmlFor="timezone" className={labelClassName}>Time Zone {requiredSpan}</label>
                            <select name="timezone" id="timezone" className={selectClassName}></select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="start-week-on" className={labelClassName}>Start Week On {requiredSpan}</label>
                            <select name="start-week-on" id="start-week-on" className={selectClassName}></select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="date-format" className={labelClassName}>Date Format {requiredSpan}</label>
                            <select name="date-format" id="date-format" className={selectClassName}></select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="time-format" className={labelClassName}>Time Format {requiredSpan}</label>
                            <select name="time-format" id="time-format" className={selectClassName}></select>
                        </div>
                    </div>
                </section>

                {/* Section Currency Information */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <CircleDollarSign size={22} className="text-indigo-600 dark:text-indigo-400"/> 
                        Currency Information
                    </h3>
                    <div className="space-y-5">
                        <div className="flex justify-between items-center">
                            <label htmlFor="currency" className={labelClassName}>Currency {requiredSpan}</label>
                            <select name="currency" id="currency" className={selectClassName}></select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="currency-symbol" className={labelClassName}>Currency Symbol {requiredSpan}</label>
                            <input type="text" id="currency-symbol" readOnly className={readOnlyInputClassName} />
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="currency-position" className={labelClassName}>Currency Position {requiredSpan}</label>
                            <select name="currency-position" id="currency-position" className={selectClassName}></select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="decimal-separator" className={labelClassName}>Decimal Separator {requiredSpan}</label>
                            <select name="decimal-separator" id="decimal-separator" className={selectClassName}></select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="thousand-separator" className={labelClassName}>Thousand Separator {requiredSpan}</label>
                            <select name="thousand-separator" id="thousand-separator" className={selectClassName}></select>
                        </div>
                    </div>
                </section>
                
                {/* Form Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LocalizationSettings;