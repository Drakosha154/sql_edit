import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from './ThemeToggle.js';
import { useTheme } from './ThemeContext';

export default function Navbar({ isAuth, setAuth }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid shadow-lg">
        <NavLink to="/" className="navbar-brand">SQL Editor</NavLink>
        <div className="collapse navbar-collapse justify-content-end" id="navbarTogglerDemo03">
          <ul className="navbar-nav">
            {!isAuth ? (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">Войти</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link">Зарегистрироваться</NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <ThemeToggle />
                </li>
                <li className="nav-item">
                  <NavLink to="/profile" className="nav-link">Профиль</NavLink>
                </li>
                <li className="nav-item">
                  <button className="btn btn-link nav-link" onClick={handleLogout}>Выйти</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}