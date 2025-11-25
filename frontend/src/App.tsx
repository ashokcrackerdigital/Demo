import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Admin from './pages/Admin';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}

export default App;

