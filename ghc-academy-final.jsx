import React, { useEffect, useState } from "react";
import { ShoppingCart, User, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

/**
 * GHC Academy - Edición Final
 * - Tienda pública (Store) accesible por defecto.
 * - Compras sin necesidad de login.
 * - Acceso Administrador oculto (requiere ?admin=1 en la URL).
 */

function Header({ onNavigate, cartCount }) {
  return (
    <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#0f172a', color: 'white' }}>
      <img src="/logo-limpio.png" alt="GHC Academy" style={{ height: '40px', cursor: 'pointer' }} onClick={() => onNavigate('store')} />
      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <button onClick={() => onNavigate('store')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={20} /> Store
        </button>
        <button onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} /> Login
        </button>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => onNavigate('checkout')}>
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px' }}>
              {cartCount}
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}

function Store({ onAddToCart }) {
  const courses = [
    { id: 1, title: "Plan de Entrenamiento Pro", price: 49.99, image: "🏃‍♂️" },
    { id: 2, title: "Nutrición Deportiva Avanzada", price: 34.99, image: "🥗" },
    { id: 3, title: "Mentalidad Ganadora", price: 19.99, image: "🧠" },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Nuestros Cursos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {courses.map(course => (
          <motion.div key={course.id} whileHover={{ y: -5 }} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{course.image}</div>
            <h3 style={{ marginBottom: '0.5rem' }}>{course.title}</h3>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>{course.price}€</p>
            <button 
              onClick={() => onAddToCart(course)}
              style={{ width: '100%', padding: '0.75rem', background: '#06b6d4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Añadir al Carrito
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Checkout({ cart, onCompletePurchase }) {
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  if (cart.length === 0) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h3>Tu carrito está vacío</h3>
        <button onClick={() => onCompletePurchase()} style={{ marginTop: '1rem', color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Volver a la tienda</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Resumen del Pedido</h2>
      {cart.map((item, index) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
          <span>{item.title}</span>
          <span>{item.price}€</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
        <span>Total:</span>
        <span>{total.toFixed(2)}€</span>
      </div>
      <button 
        onClick={onCompletePurchase}
        style={{ width: '100%', marginTop: '2rem', padding: '1rem', background: '#020617', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }}
      >
        Finalizar Compra
      </button>
    </div>
  );
}

function Login({ onLogin }) {
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      setIsAdminVisible(true);
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
        <h2 style={{ marginBottom: '2rem' }}>Sign in</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isAdminVisible && (
            <button 
              onClick={() => onLogin('admin')}
              style={{ padding: '1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Shield size={20} /> Administrator Access
            </button>
          )}
          <button 
            onClick={() => onLogin('student')}
            style={{ padding: '1rem', background: '#06b6d4', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <User size={20} /> Student Access
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GHCAcademy() {
  const [currentPage, setCurrentPage] = useState('store');
  const [cart, setCart] = useState([]);

  const handleAddToCart = (course) => {
    setCart([...cart, course]);
    alert(`${course.title} añadido al carrito`);
  };

  const handleCompletePurchase = () => {
    if (cart.length > 0) {
      alert('¡Compra realizada con éxito!');
      setCart([]);
    }
    setCurrentPage('store');
  };

  const handleLogin = (type) => {
    alert(`Has accedido como ${type}`);
    // Aquí podrías redirigir a un dashboard real
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header onNavigate={setCurrentPage} cartCount={cart.length} />
      
      {currentPage === 'store' && <Store onAddToCart={handleAddToCart} />}
      {currentPage === 'login' && <Login onLogin={handleLogin} />}
      {currentPage === 'checkout' && <Checkout cart={cart} onCompletePurchase={handleCompletePurchase} />}
    </div>
  );
}
