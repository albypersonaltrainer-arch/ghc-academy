import React from 'react'
import ReactDOM from 'react-dom/client'
import GHCAcademy from './components/ghc-academy-final'
import AdminPanel from './components/AdminPanel'
import './styles.css'

// Check if admin parameter is present in URL
const params = new URLSearchParams(window.location.search);
const isAdmin = params.get('admin') === '1';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminPanel /> : <GHCAcademy />}
  </React.StrictMode>,
)
