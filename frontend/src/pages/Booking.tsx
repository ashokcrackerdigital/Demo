import React, { useState, useEffect } from 'react';
import { startOfToday, addDays, endOfDay } from 'date-fns';
import { format } from 'date-fns';
import Calendar from '../components/Calendar';
import SlotGrid from '../components/SlotGrid';
import BookingModal from '../components/BookingModal';
import { slotsApi } from '../services/api';
import { Slot, SlotsResponse } from '../types';

const Booking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [summary, setSummary] = useState<SlotsResponse['summary'] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch slots when date changes
  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await slotsApi.getSlots(dateStr);
      setSlots(response.slots);
      setSummary(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch slots');
      setSlots([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotClick = (slot: Slot) => {
    if (slot.isBooked || slot.status === 'BOOKED') {
      return;
    }
    if (slot.type === 'OFFLINE') {
      setError('This slot cannot be booked online. Please call us for assistance.');
      return;
    }
    if (slot.type === 'EXPRESS_SAME_DAY' && slot.message.includes('Not yet available')) {
      setError('Express slots can only be booked after 6:00 AM on the same day.');
      return;
    }
    setSelectedSlot(slot);
    setIsModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleBookingConfirm = async (data: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
  }) => {
    if (!selectedSlot) {
      return;
    }

    setIsBooking(true);
    setError(null);
    setSuccess(null);

    try {
      await slotsApi.bookSlot({
        slotId: selectedSlot.id,
        ...data,
      });

      setSuccess('Booking confirmed successfully!');
      setIsModalOpen(false);
      setSelectedSlot(null);
      
      // Refresh slots
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book slot');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
        <p className="text-gray-600">Select a date and time slot for your appointment</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p>{success}</p>
        </div>
      )}

      {/* Calendar */}
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        minDate={startOfToday()}
        maxDate={endOfDay(addDays(startOfToday(), 14))} // Next 15 days (today + 14, inclusive)
      />

      {/* Slots Grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading slots...</p>
        </div>
      ) : slots.length > 0 ? (
        <SlotGrid
          slots={slots}
          summary={summary || undefined}
          onSlotClick={handleSlotClick}
          selectedSlotId={selectedSlot?.id}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No slots available for this date.</p>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        slot={selectedSlot}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleBookingConfirm}
        isLoading={isBooking}
      />
    </div>
  );
};

export default Booking;

