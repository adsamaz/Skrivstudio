import { createSignal, onMount } from 'solid-js';
import { useNavigate, useSearchParams, A } from '@solidjs/router';
import { useAuth } from '../stores/auth';

export default function Login() {
    const [, { login }] = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [error, setError] = createSignal('');
    const [info, setInfo] = createSignal('');
    const [loading, setLoading] = createSignal(false);

    onMount(() => {
        if (searchParams.verified === '1') {
            setInfo('E-postadressen är verifierad. Du kan nu logga in.');
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ email: email(), password: password() });
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
                    {info() && <p class="text-center text-sm mb-2" style="color:var(--color-success)">{info()}</p>}
                    <form onSubmit={handleSubmit}>
                        <div class="form-group">
                            <label class="form-label" for="email">E-postadress</label>
                            <input
                                id="email"
                                class="input"
                                type="email"
                                value={email()}
                                onInput={(e) => setEmail(e.currentTarget.value)}
                                autocomplete="email"
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
