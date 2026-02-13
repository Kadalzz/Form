import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import MainLayout from './components/layouts/MainLayout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FormBuilder from './pages/FormBuilder'
import FormView from './pages/FormView'
import FormResponses from './pages/FormResponses'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/form/:id" element={<FormView />} />

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/form/:id/edit" element={isAuthenticated ? <FormBuilder /> : <Navigate to="/login" />} />
        <Route path="/form/:id/responses" element={isAuthenticated ? <FormResponses /> : <Navigate to="/login" />} />
        <Route path="/create" element={isAuthenticated ? <FormBuilder /> : <Navigate to="/login" />} />
      </Route>

      {/* Default Route */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  )
}

export default App
