import React, { useState } from 'react';
import { startOfToday, addDays, endOfDay, format } from 'date-fns';
import Calendar from '../components/Calendar';
import BookingModal from '../components/BookingModal';
import Button from '../components/Button';
import { slotsApi } from '../services/api';

const Booking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ message: string; slotTime?: string } | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleBookingConfirm = async (data: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
  }) => {
    setIsBooking(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await slotsApi.bookSlotByDate(dateStr, data);

      // Format slot time for display
      const slotTime = response.slotTime 
        ? format(new Date(response.slotTime), 'HH:mm')
        : undefined;

      setSuccessMessage({
        message: response.message || 'Booking confirmed successfully!',
        slotTime,
      });
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book slot');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
        <p className="text-gray-600">Select a date to book your appointment</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Success Popup Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseSuccess}
              aria-hidden="true"
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Booking Confirmed!
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {successMessage.message}
                  </p>
                  {successMessage.slotTime && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Your appointment time:</p>
                      <p className="text-2xl font-bold text-green-700">
                        {successMessage.slotTime}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(selectedDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleCloseSuccess}
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={handleDateClick}
        minDate={startOfToday()}
        maxDate={endOfDay(addDays(startOfToday(), 14))} // Next 15 days (today + 14, inclusive)
      />

      {/* Booking Modal */}
      <BookingModal
        date={selectedDate}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleBookingConfirm}
        isLoading={isBooking}
      />
    </div>
  );
};

export default Booking;

