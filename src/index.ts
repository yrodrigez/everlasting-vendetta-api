import { createApp } from "./infrastructure/http/app";

export default {
    async fetch(request: Request, env: any): Promise<Response> {
        // Make env variables available globally via process.env
        Object.assign(process.env, env);

        const app = createApp();
        return app.fetch(request, env);
    },
};
