import { Hono } from 'hono';
import profileCharactersRouter from './wow-profile-characters-route';
import { characterRoutes } from './characters-route';

const hono = new Hono();
hono.route('/profile/characters', profileCharactersRouter);
hono.route('/user/characters', characterRoutes);

export default hono;