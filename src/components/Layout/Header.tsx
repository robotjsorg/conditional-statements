import { NavLink } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">Conditional Statements</h1>
        <nav>
          <ul>
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
            </li>
            <li>
              <NavLink to="/explanation" className={({ isActive }) => isActive ? 'active' : ''}>Explanation</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
