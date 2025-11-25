import React, { useState } from 'react';
import { format } from 'date-fns';
import { Slot } from '../types';
import Button from './Button';

interface BookingModalProps {
  slot: Slot | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({
  slot,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !slot) {
    return null;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Name is required';
    }

    if (!formData.patientEmail.trim()) {
      newErrors.patientEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patientEmail)) {
      newErrors.patientEmail = 'Invalid email format';
    }

    if (!formData.patientPhone.trim()) {
      newErrors.patientPhone = 'Phone is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.patientPhone)) {
      newErrors.patientPhone = 'Invalid phone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      await onConfirm(formData);
      // Reset form on success
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
      });
      setErrors({});
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Book Appointment
              </h3>

              {/* Slot Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {format(new Date(slot.date), 'MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Time:</strong> {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {slot.type}
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="patientName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.patientName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.patientName && (
                    <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="patientEmail"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="patientEmail"
                    name="patientEmail"
                    value={formData.patientEmail}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.patientEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.patientEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.patientEmail}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="patientPhone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="patientPhone"
                    name="patientPhone"
                    value={formData.patientPhone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.patientPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.patientPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.patientPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full sm:w-auto sm:ml-3"
              >
                Confirm Booking
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="mt-3 sm:mt-0 w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

