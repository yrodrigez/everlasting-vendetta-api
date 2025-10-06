import { Hono } from 'hono';
import { loginRoute } from './login';
import { refreshRoute } from './refresh';

const hono = new Hono();
hono.route('/login', loginRoute);
hono.route('/refresh', refreshRoute);

export default hono;