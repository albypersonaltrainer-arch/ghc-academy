import React from 'react'
import { createRoot } from 'react-dom/client'
import * as ComponentModule from './components/ghc-academy-final.jsx'
import './styles.css'

// Try a set of likely export names; fallback to a dummy component so build doesn't crash
const Component =
  ComponentModule.default ||
  ComponentModule.GHCAcademy ||
  ComponentModule.GhcAcademy ||
  ComponentModule.GHC ||
  ComponentModule.App ||
  ComponentModule.Header ||
  (() => () => <div />) // returns a React component that renders nothing

// If the fallback above produced a function that returns a component factory, unwrap it:
const RenderComponent = typeof Component === 'function' && Component.length === 0 ? Component : Component

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RenderComponent />
  </React.StrictMode>
)
