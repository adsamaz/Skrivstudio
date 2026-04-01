import { ParentComponent, Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '../stores/auth';

const TeacherRoute: ParentComponent = (props) => {
    const [auth] = useAuth();
    return (
        <Show when={!auth.loading} fallback={<div class="loading">Laddar...</div>}>
            <Show when={auth.user?.role === 'teacher'} fallback={<Navigate href="/" />}>
                {props.children}
            </Show>
        </Show>
    );
};

export default TeacherRoute;
