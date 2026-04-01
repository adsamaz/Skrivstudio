import { createSignal } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import { useAuth } from '../stores/auth';

export default function Login() {
    const [, { login }] = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [error, setError] = createSignal('');
    const [loading, setLoading] = createSignal(false);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ username: username(), password: password() });
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Inloggning misslyckades');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="page">
            <div style="max-width:400px;margin:2rem auto">
                <div class="card">
                    <h1 class="page-title text-center mb-2">Logga in</h1>
                    <form onSubmit={handleSubmit}>
                        <div class="form-group">
                            <label class="form-label" for="username">Användarnamn</label>
                            <input
                                id="username"
                                class="input"
                                type="text"
                                value={username()}
                                onInput={(e) => setUsername(e.currentTarget.value)}
                                autocomplete="username"
                                required
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="password">Lösenord</label>
                            <input
                                id="password"
                                class="input"
                                type="password"
                                value={password()}
                                onInput={(e) => setPassword(e.currentTarget.value)}
                                autocomplete="current-password"
                                required
                            />
                        </div>
                        {error() && <p class="error-text mb-1">{error()}</p>}
                        <button class="btn btn-primary w-full" type="submit" disabled={loading()}>
                            {loading() ? 'Loggar in...' : 'Logga in'}
                        </button>
                    </form>
                    <p class="text-center text-sm mt-2 text-muted">
                        Inget konto?{' '}
                        <A href="/register">Registrera dig</A>
                    </p>
                </div>
            </div>
        </div>
    );
}
