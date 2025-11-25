import React, { useState, useEffect } from 'react';
import {
  format,
  addDays,
  startOfToday,
  endOfDay,
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
  maxDate = endOfDay(addDays(startOfToday(), 14)), // Today + 14 more days = 15 days total (inclusive)
}) => {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const isNavigatingRef = React.useRef(false);

  // Sync calendar view with selected date - but don't interfere with navigation
  useEffect(() => {
    // Skip sync if we just navigated
    if (isNavigatingRef.current) {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 50);
      return;
    }
    
    const selectedMonth = startOfMonth(selectedDate);
    const currentMonthStart = startOfMonth(currentMonth);
    // Only update if selected date month is different from displayed month
    if (selectedMonth.getTime() !== currentMonthStart.getTime()) {
      setCurrentMonth(selectedMonth);
    }
  }, [selectedDate]); // Only depend on selectedDate, not currentMonth

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
  // Normalize maxDate - extract just the date part (year, month, day) without time
  const normalizedMaxDate = normalizeDate(new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));

  // Calculate navigation states for button styling
  const prevMonth = subMonths(currentMonth, 1);
  const prevMonthEnd = normalizeDate(endOfMonth(prevMonth));
  const canGoPrevious = prevMonthEnd.getTime() >= normalizedMinDate.getTime();

  const nextMonth = addMonths(currentMonth, 1);
  const nextMonthStart = normalizeDate(startOfMonth(nextMonth));
  const canGoNext = nextMonthStart.getTime() <= normalizedMaxDate.getTime();

  // Navigation handlers - simple and direct
  const goToPreviousMonth = () => {
    if (!canGoPrevious) return;
    isNavigatingRef.current = true; // Mark that we're navigating
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    isNavigatingRef.current = true; // Mark that we're navigating
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
  };

  const goToToday = () => {
    const todayStart = startOfMonth(today);
    setCurrentMonth(todayStart);
    onDateSelect(today);
  };

  const isDateDisabled = (date: Date): boolean => {
    const normalizedDate = normalizeDate(date);
    return !isWithinInterval(normalizedDate, { start: normalizedMinDate, end: normalizedMaxDate });
  };

  const isDateSelectable = (date: Date): boolean => {
    const normalizedDate = normalizeDate(date);
    return isWithinInterval(normalizedDate, { start: normalizedMinDate, end: normalizedMaxDate });
  };

  const handleDateClick = (date: Date) => {
    const clickedMonth = startOfMonth(date);
    const isClickOnDifferentMonth = !isSameMonth(date, currentMonth);
    
    // If clicking on a date from a different month (next/previous month visible in calendar)
    if (isClickOnDifferentMonth && isDateSelectable(date)) {
      // Navigate to that month
      setCurrentMonth(clickedMonth);
      // Select the date
      onDateSelect(date);
    } else if (isDateSelectable(date)) {
      // Same month - just select the date
      onDateSelect(date);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with Month/Year and Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            goToPreviousMonth();
          }}
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
          title={canGoPrevious ? 'Go to previous month' : 'Cannot navigate before available date range'}
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
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            goToNextMonth();
          }}
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
          title={canGoNext ? 'Go to next month' : 'Cannot navigate beyond available date range'}
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
          const isDifferentMonth = !isCurrentMonth;

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={isDifferentMonth ? false : !isSelectable}
              className={`
                relative p-2 rounded-lg transition-colors min-h-[40px] flex items-center justify-center
                ${!isCurrentMonth
                  ? isSelectable 
                    ? 'text-primary-600 hover:bg-primary-50 cursor-pointer font-medium'
                    : 'text-gray-300 cursor-not-allowed'
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
              aria-label={isDifferentMonth 
                ? `Navigate to ${format(date, 'MMMM')} and select ${format(date, 'd')}`
                : `Select date ${format(date, 'MMMM d, yyyy')}`
              }
              aria-disabled={isDifferentMonth ? false : !isSelectable}
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

