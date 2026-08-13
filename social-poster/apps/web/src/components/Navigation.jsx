import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="nav">
      <div className="nav-content">
        <h1>Social Poster</h1>
        <ul className="nav-links">
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          {user?.systemRole === 'SUPERUSER' && (
            <>
              <li>
                <Link to="/companies">Companies</Link>
              </li>
              <li>
                <Link to="/audit">Audit</Link>
              </li>
            </>
          )}
          <li>
            <Link to="/posts">Posts</Link>
          </li>
          <li>
            <Link to="/comments">Comments</Link>
          </li>
          <li>
            <Link to="/inbox">Inbox</Link>
          </li>
          <li>
            <Link to="/analytics">Analytics</Link>
          </li>
          <li>
            <button onClick={logout} className="btn btn-secondary">
              Logout ({user?.name})
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
