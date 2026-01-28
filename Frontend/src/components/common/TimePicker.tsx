"use client";
import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TimePicker({ value, onChange, placeholder = "Select time", className = "" }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      setSelectedHour(hours);
      setSelectedMinute(minutes);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayTime = () => {
    if (!value) return placeholder;
    return value;
  };

  const handleTimeSelect = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 4 }, (_, i) => i * 15);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border rounded text-left bg-white hover:bg-gray-50 flex justify-between items-center"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayTime()}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Hours */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Hour</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                  className="w-full p-1 border rounded text-sm"
                >
                  {hours.map(hour => (
                    <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>

              {/* Minutes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Min</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(Number(e.target.value))}
                  className="w-full p-1 border rounded text-sm"
                >
                  {minutes.map(minute => (
                    <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTimeSelect}
                className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Select
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}