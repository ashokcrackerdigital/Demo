import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { adminApi } from '../services/api';
import Button from '../components/Button';
import { SlotType, SlotStatus } from '../types';

interface AdminSlot {
  id: number;
  facilityId: number;
  date: string;
  startTime: string;
  endTime: string;
  type: SlotType;
  status: SlotStatus;
  booking: {
    id: number;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const Admin: React.FC = () => {
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: '',
    type: '',
    status: '',
  });

  useEffect(() => {
    fetchSlots();
  }, [filters]);

  const fetchSlots = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};
      if (filters.date) params.date = filters.date;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;

      const response = await adminApi.getAllSlots(params);
      setSlots(response.slots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch slots');
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverride = async (slotId: number, newStatus: SlotStatus) => {
    try {
      await adminApi.overrideSlot(slotId, newStatus);
      // Refresh slots
      await fetchSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to override slot');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage slots and view bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value={SlotType.ONLINE}>Online</option>
              <option value={SlotType.EXPRESS_SAME_DAY}>Express Same-Day</option>
              <option value={SlotType.OFFLINE}>Offline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value={SlotStatus.AVAILABLE}>Available</option>
              <option value={SlotStatus.BOOKED}>Booked</option>
              <option value={SlotStatus.CANCELLED}>Cancelled</option>
              <option value={SlotStatus.OVERRIDDEN}>Overridden</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters({ date: '', type: '', status: '' })}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Slots Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading slots...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No slots found
                    </td>
                  </tr>
                ) : (
                  slots.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(slot.date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {slot.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          slot.status === SlotStatus.AVAILABLE
                            ? 'bg-green-100 text-green-800'
                            : slot.status === SlotStatus.BOOKED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {slot.booking ? (
                          <div className="text-sm">
                            <div className="text-gray-900">{slot.booking.patientName}</div>
                            <div className="text-gray-500">{slot.booking.patientEmail}</div>
                            <div className="text-gray-500">{slot.booking.patientPhone}</div>
                            <div className="text-xs text-gray-400">
                              {format(new Date(slot.booking.createdAt), 'MMM d, HH:mm')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No booking</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOverride(slot.id, SlotStatus.AVAILABLE)}
                            disabled={slot.status === SlotStatus.AVAILABLE}
                          >
                            Set Available
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOverride(slot.id, SlotStatus.CANCELLED)}
                            disabled={slot.status === SlotStatus.CANCELLED}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      {slots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">{slots.length}</div>
            <div className="text-sm text-gray-600">Total Slots</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {slots.filter(s => s.status === SlotStatus.AVAILABLE && !s.booking).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-red-600">
              {slots.filter(s => s.status === SlotStatus.BOOKED || s.booking).length}
            </div>
            <div className="text-sm text-gray-600">Booked</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-600">
              {slots.filter(s => s.status === SlotStatus.CANCELLED).length}
            </div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

