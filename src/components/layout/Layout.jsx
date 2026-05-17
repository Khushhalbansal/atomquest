import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../common/ToastContainer';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <Sidebar />
      <div className="app-main">
        <Header />
        <main id="main-content" className="app-content" role="main">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
