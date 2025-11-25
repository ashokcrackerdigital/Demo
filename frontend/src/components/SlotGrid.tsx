import React from 'react';
import { format } from 'date-fns';
import { Slot, SlotType } from '../types';
import Button from './Button';

interface SlotGridProps {
  slots: Slot[];
  summary?: {
    online: { allBooked: boolean };
    express: { allBooked: boolean };
  };
  onSlotClick: (slot: Slot) => void;
  selectedSlotId?: number;
}

const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  summary,
  onSlotClick,
  selectedSlotId,
}) => {
  // Group slots by hour
  const slotsByHour = slots.reduce((acc, slot) => {
    const hour = format(new Date(slot.startTime), 'HH:mm');
    if (!acc[hour]) {
      acc[hour] = [];
    }
    acc[hour].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const getSlotColor = (slot: Slot) => {
    if (slot.isBooked || slot.status === 'BOOKED') {
      return 'bg-gray-300 text-gray-600 cursor-not-allowed';
    }
    if (slot.type === SlotType.OFFLINE) {
      return 'bg-yellow-100 text-yellow-800 cursor-not-allowed';
    }
    if (slot.type === SlotType.EXPRESS_SAME_DAY && slot.message.includes('Not yet available')) {
      return 'bg-orange-100 text-orange-800 cursor-not-allowed';
    }
    if (slot.id === selectedSlotId) {
      return 'bg-primary-600 text-white hover:bg-primary-700';
    }
    return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer';
  };

  const canBookSlot = (slot: Slot) => {
    if (slot.isBooked || slot.status === 'BOOKED') {
      return false;
    }
    if (slot.type === SlotType.OFFLINE) {
      return false;
    }
    if (slot.type === SlotType.EXPRESS_SAME_DAY && slot.message.includes('Not yet available')) {
      return false;
    }
    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Slots</h2>

      {/* Summary Messages */}
      {summary && (
        <div className="mb-6 space-y-2">
          {summary.online.allBooked && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              All our slots for ONLINE on this date are booked.
            </div>
          )}
          {summary.express.allBooked && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              All our slots for EXPRESS SAME-DAY on this date are booked.
            </div>
          )}
        </div>
      )}

      {/* Slots by hour */}
      <div className="space-y-6">
        {Object.entries(slotsByHour).map(([hour, hourSlots]) => (
          <div key={hour}>
            <h3 className="text-lg font-medium text-gray-700 mb-2">{hour}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {hourSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => canBookSlot(slot) && onSlotClick(slot)}
                  disabled={!canBookSlot(slot)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${getSlotColor(slot)}
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                  `}
                  title={slot.message}
                  aria-label={`${format(new Date(slot.startTime), 'HH:mm')} - ${slot.message}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{slot.type === SlotType.EXPRESS_SAME_DAY ? '🚀' : slot.type === SlotType.OFFLINE ? '📞' : '💻'}</span>
                    <span className="mt-1">
                      {format(new Date(slot.startTime), 'HH:mm')}
                    </span>
                    <span className="text-xs mt-1 opacity-75">
                      {slot.type === SlotType.EXPRESS_SAME_DAY ? 'Express' : slot.type === SlotType.OFFLINE ? 'Offline' : 'Online'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 rounded"></div>
            <span>Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 rounded"></div>
            <span>Express (Not yet available)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotGrid;

