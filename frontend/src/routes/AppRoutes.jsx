import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ProductsPage from '../pages/ProductsPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CategoriesPage from '../pages/CategoriesPage';
import WarehousesPage from '../pages/WarehousesPage';
import WarehouseDetailPage from '../pages/WarehouseDetailPage';
import InventoryPage from '../pages/InventoryPage';
import StockInPage from '../pages/StockInPage';
import StockOutPage from '../pages/StockOutPage';
import TransfersPage from '../pages/TransfersPage';
import AdjustmentPage from '../pages/AdjustmentPage';
import HistoryPage from '../pages/HistoryPage';
import AlertsPage from '../pages/AlertsPage';
import UsersPage from '../pages/UsersPage';
import SettingsPage from '../pages/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/warehouses/:id" element={<WarehouseDetailPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/stock-in" element={<StockInPage />} />
        <Route path="/stock-out" element={<StockOutPage />} />
        {/* Transfers: Restricted to Admin and Manager only */}
        <Route
          path="/transfers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <TransfersPage />
            </ProtectedRoute>
          }
        />
        
        {/* Adjustment: Restricted to Admin and Manager only */}
        <Route
          path="/adjustment"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <AdjustmentPage />
            </ProtectedRoute>
          }
        />

        <Route path="/history" element={<HistoryPage />} />
        <Route path="/alerts" element={<AlertsPage />} />

        {/* User Management: Restricted to Admin only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
