import { Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { useAuth } from '../stores/auth';

export default function Navbar() {
    const [auth, { logout }] = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav class="navbar">
            <div class="navbar-inner">
                <A href={auth.user ? '/' : '/exercises'} class="navbar-brand">
                    Skrivstudio
                </A>
                <div class="navbar-links">
                    <A href="/exercises" class="navbar-link" activeClass="navbar-link--active">
                        Övningar
                    </A>
                    <Show when={auth.user}>
                        <A href="/" class="navbar-link" end activeClass="navbar-link--active">
                            Hem
                        </A>
                        <A href="/progress" class="navbar-link" activeClass="navbar-link--active">
                            Framsteg
                        </A>
                        <Show when={auth.user?.role === 'teacher'}>
                            <A href="/admin" class="navbar-link" activeClass="navbar-link--active">
                                Admin
                            </A>
                        </Show>
                    </Show>
                </div>
                <div class="navbar-actions">
                    <Show
                        when={auth.user}
                        fallback={
                            <>
                                <A href="/login" class="btn btn-secondary btn-sm">
                                    Logga in
                                </A>
                                <A href="/register" class="btn btn-primary btn-sm">
                                    Registrera
                                </A>
                            </>
                        }
                    >
                        <span class="navbar-user">{auth.user?.username}</span>
                        <button class="btn btn-secondary btn-sm" onClick={handleLogout}>
                            Logga ut
                        </button>
                    </Show>
                </div>
            </div>
        </nav>
    );
}
