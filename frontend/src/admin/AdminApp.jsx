import { Route, Routes } from 'react-router';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import NotFound from '../pages/NotFound';

/** /admin/* — signed-out users and non-admins are sent to the admin login screen. */
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        element={
          <ProtectedRoute role="admin" redirectTo="/admin/login" forbiddenTo="/admin/login">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
