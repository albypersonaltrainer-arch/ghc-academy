import React from 'react'
import ReactDOM from 'react-dom/client'
import GHCAcademy from './components/ghc-academy-final'
import AdminPanel from './components/AdminPanel'
import './styles.css'

const params = new URLSearchParams(window.location.search);
const isAdmin = params.get('admin') === '1';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Cargamos la tienda siempre para mantener la estética */}
    <GHCAcademy />
    
    {/* Si pones ?admin=1, el panel sale flotando encima sin romper la tienda */}
    {isAdmin && (
      <div style={{
        position: 'fixed',
        top: '5%',
        left: '5%',
        width: '90%',
        height: '90%',
        backgroundColor: 'white',
        zIndex: 9999,
        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
        borderRadius: '20px',
        overflow: 'auto',
        border: '5px solid #ff7a3d'
      }}>
        <div style={{padding: '20px'}}>
          <button 
            onClick={() => window.location.href = window.location.pathname}
            style={{float: 'right', background: '#ff7a3d', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer'}}
          >
            Cerrar Admin
          </button>
          <AdminPanel />
        </div>
      </div>
    )}
  </React.StrictMode>,
)
