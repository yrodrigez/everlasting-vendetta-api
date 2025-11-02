import { Hono } from 'hono';
import { loginRoute } from './login';
import { refreshRoute } from './refresh';
import { sessionsRoute } from './sessions';
import { revokeRoute } from './revoke';
import { revokeAllRoute } from './revoke-all';

const hono = new Hono();
hono.route('/login', loginRoute);
hono.route('/refresh', refreshRoute);
hono.route('/sessions', sessionsRoute);
hono.route('/revoke', revokeRoute);
hono.route('/revoke_all', revokeAllRoute);

export default hono;