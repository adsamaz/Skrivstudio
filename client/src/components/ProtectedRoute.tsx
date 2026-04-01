import { ParentComponent, Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '../stores/auth';

const ProtectedRoute: ParentComponent = (props) => {
    const [auth] = useAuth();
    return (
        <Show when={!auth.loading} fallback={<div class="loading">Laddar...</div>}>
            <Show when={auth.user} fallback={<Navigate href="/login" />}>
                {props.children}
            </Show>
        </Show>
    );
};

export default ProtectedRoute;
