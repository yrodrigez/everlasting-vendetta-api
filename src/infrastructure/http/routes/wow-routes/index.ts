import { Hono } from 'hono';
import profileCharactersRouter from './wow-profile-characters-route';

const hono = new Hono();
hono.route('/profile/characters', profileCharactersRouter);

export default hono;