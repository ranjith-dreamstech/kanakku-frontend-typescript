import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { FC } from 'react';

interface DateInputProps {
    label: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    minDate?: Date;
}

const DateInput: FC<DateInputProps> = ({ label, value, onChange, minDate }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ">
                {label}
            </label>
            <DatePicker
                value={value}
                onChange={onChange}
                minDate={minDate}
                // FIX: Renamed `inputFormat` to `format`
                format="MM/dd/yyyy"
                // FIX: Replaced `renderInput` with `slotProps`
                slotProps={{
                    textField: {
                        size: 'small',
                        fullWidth: true,
                        sx: {
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            '& .MuiOutlinedInput-root': {
                                paddingRight: '8px',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#d1d5db', // Tailwind gray-300
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#a855f7', // Tailwind purple-500
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#a855f7',
                            },
                        },
                    },
                }}
            />
        </div>
    );
};

export default DateInput;