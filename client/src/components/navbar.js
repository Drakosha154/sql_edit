
import { Container } from 'react-bootstrap';
import { NavLink as Link } from "react-router-dom";


export default function Navbar() {
  return (
        <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid shadow-lg">
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarTogglerDemo03" aria-controls="navbarTogglerDemo03" aria-expanded="false" aria-label="Переключатель навигации">
        <span class="navbar-toggler-icon"></span>
      </button>
      <a class="navbar-brand" href="http://localhost:3000/">SQL Editor</a>
      <div class="collapse navbar-collapse justify-content-end" id="navbarTogglerDemo03">
        <form class="d-flex" role="search">
          <input class="form-control me-2" type="search" placeholder="Поиск" aria-label="Поиск"></input>
          <button class="btn btn-outline-success" type="submit">Поиск</button>
        </form>
        <ul class="navbar-nav">
          <li class="nav-item">
            <Link to="/create" className="nav-link">Создать задание</Link>
          </li>
          <li class="nav-item">
            <Link to="/profile" className="nav-link">Профиль</Link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  );
}