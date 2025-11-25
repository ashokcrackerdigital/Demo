import React, { useState, useEffect } from 'react';
import {
  format,
  addDays,
  startOfToday,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isWithinInterval,
} from 'date-fns';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate = startOfToday(),
  maxDate = addDays(startOfToday(), 15),
}) => {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  // Sync calendar view with selected date
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(selectedDate));
    }
  }, [selectedDate, currentMonth]);

  // Generate calendar grid for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Sunday

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Normalize dates for comparison (remove time components)
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const normalizedMinDate = normalizeDate(minDate);
  const normalizedMaxDate = normalizeDate(maxDate);

  // Check if we can navigate to previous month
  // Allow navigation if previous month has any dates in the valid range
  const prevMonth = subMonths(currentMonth, 1);
  const prevMonthEnd = normalizeDate(endOfMonth(prevMonth));
  const canGoPrevious = prevMonthEnd.getTime() >= normalizedMinDate.getTime();

  // Check if we can navigate to next month  
  // Allow navigation if next month has any dates in the valid range
  const nextMonth = addMonths(currentMonth, 1);
  const nextMonthStart = normalizeDate(startOfMonth(nextMonth));
  const canGoNext = nextMonthStart.getTime() <= normalizedMaxDate.getTime();

  const goToPreviousMonth = () => {
    if (canGoPrevious) {
      setCurrentMonth(prevMonth);
    }
  };

  const goToNextMonth = () => {
    if (canGoNext) {
      setCurrentMonth(nextMonth);
    }
  };

  const goToToday = () => {
    const todayStart = startOfMonth(today);
    setCurrentMonth(todayStart);
    onDateSelect(today);
  };

  const isDateDisabled = (date: Date): boolean => {
    return !isWithinInterval(date, { start: minDate, end: maxDate });
  };

  const isDateSelectable = (date: Date): boolean => {
    return isWithinInterval(date, { start: minDate, end: maxDate });
  };

  const handleDateClick = (date: Date) => {
    if (isDateSelectable(date)) {
      onDateSelect(date);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with Month/Year and Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className={`
            p-2 rounded-lg transition-colors
            ${canGoPrevious
              ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed opacity-50'
            }
            focus:outline-none focus:ring-2 focus:ring-primary-500
          `}
          aria-label="Previous month"
          aria-disabled={!canGoPrevious}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className={`
            p-2 rounded-lg transition-colors
            ${canGoNext
              ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed opacity-50'
            }
            focus:outline-none focus:ring-2 focus:ring-primary-500
          `}
          aria-label="Next month"
          aria-disabled={!canGoNext}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}

        {/* Date cells */}
        {days.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isDisabled = isDateDisabled(date);
          const isSelectable = isDateSelectable(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={!isSelectable}
              className={`
                relative p-2 rounded-lg transition-colors min-h-[40px] flex items-center justify-center
                ${!isCurrentMonth
                  ? 'text-gray-300'
                  : isDisabled
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : isSelected
                  ? 'bg-primary-600 text-white font-semibold hover:bg-primary-700'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }
                ${isTodayDate && !isSelected && isCurrentMonth && !isDisabled
                  ? 'ring-2 ring-primary-400'
                  : ''
                }
                focus:outline-none focus:ring-2 focus:ring-primary-500
              `}
              aria-label={`Select date ${format(date, 'MMMM d, yyyy')}`}
              aria-disabled={!isSelectable}
            >
              <span className="block text-sm">{format(date, 'd')}</span>
              {isTodayDate && isCurrentMonth && !isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span>Selected: </span>
            <strong className="text-gray-900">
              {format(selectedDate, 'MMMM d, yyyy')}
            </strong>
          </div>
          <div className="text-xs text-gray-500">
            Available: {format(minDate, 'MMM d')} - {format(maxDate, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

