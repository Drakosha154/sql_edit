import { NavLink as Link } from "react-router-dom";


export default function Navbar() {
  return (
  <nav className="navbar navbar-expand-lg bg-body-tertiary">
    <div className="container-fluid shadow-lg">
      <a className="navbar-brand" href="http://localhost:3000/">SQL Editor</a>
      <div className="collapse navbar-collapse justify-content-end" id="navbarTogglerDemo03">
        <form className="d-flex" id="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Поиск..."
            onChange={(e) => console.log(e.target.value)} // Для теста
        />
          <button className="btn btn-outline-success" type="submit">Поиск</button>
        </form>
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link to="/create" className="nav-link">Создать задание</Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className="nav-link">Профиль</Link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  );
}