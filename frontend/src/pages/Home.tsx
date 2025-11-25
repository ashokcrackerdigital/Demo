import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Healthcare Booking
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Book your appointment with ease. Choose from online slots or express same-day appointments.
        </p>
        <Link to="/booking">
          <Button size="lg" variant="primary">
            Book an Appointment
          </Button>
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">💻</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Online Slots</h3>
          <p className="text-gray-600">
            Book appointments online up to 15 days in advance. Available 24/7.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Express Same-Day</h3>
          <p className="text-gray-600">
            Need an appointment today? Book express slots available after 6:00 AM.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">📞</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Offline Booking</h3>
          <p className="text-gray-600">
            Some slots require phone booking. Call us for assistance.
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Select your preferred date from the calendar</li>
          <li>Choose an available time slot</li>
          <li>Fill in your contact information</li>
          <li>Confirm your booking</li>
        </ol>
      </div>

      {/* Facility Hours */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Facility Hours</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Monday - Friday:</strong> 10:00 AM - 5:00 PM</p>
          <p><strong>Saturday - Sunday:</strong> Closed</p>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          * Slots are available in 6-minute intervals throughout the day.
        </p>
      </div>
    </div>
  );
};

export default Home;

