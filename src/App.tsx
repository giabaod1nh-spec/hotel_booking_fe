import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ChangePassword } from './pages/ChangePassword';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { SearchResults } from './pages/SearchResults';
import { HotelInfo } from './pages/HotelInfo';
import { BookingSuccess } from './pages/BookingSuccess';
import { BookingFailed } from './pages/BookingFailed';
import { Reception } from './pages/Reception';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search/results" element={<SearchResults />} />
          <Route path="/hotel/:hotelId" element={<HotelInfo />} />
          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="/booking/failed" element={<BookingFailed />} />
          <Route path="/reception" element={<Reception />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
