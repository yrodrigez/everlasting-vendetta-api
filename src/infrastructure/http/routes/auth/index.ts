import { Hono } from 'hono';
import { loginRoute } from './login';

const hono = new Hono();
hono.route('/login', loginRoute);

export default hono;