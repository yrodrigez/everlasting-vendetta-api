import { Hono } from 'hono';
import profileCharactersRouter from './wow-profile-characters-route';
import { characterRoutes } from './characters-route';
import itemRouter from './item-route';
import characterAvatarRouter from './character-avatar-route';
import wowCharacterRouter from './wow-character-route';
import { authMiddleware } from '@http/middleware/auth.middleware';
import rosterRouter from './roster-route';

const hono = new Hono();
hono.use('*', authMiddleware);
hono.route('/profile/characters', profileCharactersRouter);
hono.route('/user/characters', characterRoutes);
hono.route('/item', itemRouter);
hono.route('/character/avatar', characterAvatarRouter);
hono.route('/character', wowCharacterRouter);
hono.route('/roster', rosterRouter);

export default hono;
