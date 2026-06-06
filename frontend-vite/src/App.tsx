import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OffersPage from './pages/OffersPage';
import WithdrawPage from './pages/WithdrawPage';
import SupportPage from './pages/SupportPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CouponsPage from './pages/CouponsPage';
import DepositPage from './pages/DepositPage';
import AdBlockDetector from './components/AdBlockDetector';

function App() {
  return (
    <>
      <AdBlockDetector />
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/offers" element={<OffersPage />} />
      <Route path="/withdraw" element={<WithdrawPage />} />
      <Route path="/deposit" element={<DepositPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/coupons" element={<CouponsPage />} />
    </Routes>
    </>
  );
}

export default App;
