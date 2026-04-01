import { Router, Route } from '@solidjs/router';
import { lazy, ParentProps } from 'solid-js';
import { AuthProvider } from './stores/auth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherRoute from './components/TeacherRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Exercises = lazy(() => import('./pages/Exercises'));
const ExercisePlay = lazy(() => import('./pages/ExercisePlay'));
const Progress = lazy(() => import('./pages/Progress'));
const Admin = lazy(() => import('./pages/Admin'));

function Layout(props: ParentProps) {
    return (
        <>
            <Navbar />
            {props.children}
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router root={Layout}>
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/exercises" component={Exercises} />
                <Route path="/exercises/:id" component={ExercisePlay} />
                <Route
                    path="/"
                    component={() => (
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/progress"
                    component={() => (
                        <ProtectedRoute>
                            <Progress />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/admin"
                    component={() => (
                        <TeacherRoute>
                            <Admin />
                        </TeacherRoute>
                    )}
                />
            </Router>
        </AuthProvider>
    );
}
