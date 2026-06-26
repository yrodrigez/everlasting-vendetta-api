import { BlizzardApiError } from "../../domain/errors/blizzard-api-error.ts";

export type BlizzardQueryParams = Record<
    string,
    string | number | boolean | null | undefined
>;

export type BlizzardHeaders = Record<string, string>;

export type BlizzardRequestOptions = {
    path: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    query?: BlizzardQueryParams;
    headers?: BlizzardHeaders;
    /** Overrides the client's default token for this request. */
    token?: string | null;
    /**
     * If an object is provided, it will be JSON.stringified and sent with
     * Content-Type: application/json unless you override it in headers.
     */
    body?: unknown;
    signal?: AbortSignal;
};

export type BlizzardHttpClientConfig = {
    baseUrl: string;
    /** If provided, appended as ?locale=... */
    locale?: string;
    /** Default bearer token used when a request doesn't pass token. */
    token?: string;
    fetchImpl?: typeof fetch;
    defaultHeaders?: BlizzardHeaders;
};

export class BlizzardHttpClient {
    private readonly fetchImpl: typeof fetch;

    constructor(private readonly config: BlizzardHttpClientConfig) {
        this.fetchImpl = config.fetchImpl ?? fetch;
    }

    private sanitizeUrl(url: string): string {
        return url.trim().replace(/\/+$/g, "");
    }

    createUrl(path: string, query?: BlizzardQueryParams): string {
        const normalizedBase = this.sanitizeUrl(this.config.baseUrl);
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        const url = new URL(`${normalizedBase}${normalizedPath}`);

        if (this.config.locale) {
            url.searchParams.set("locale", this.config.locale);
        }

        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value === undefined || value === null) continue;
                url.searchParams.set(key, String(value));
            }
        }

        return url.toString();
    }

    private resolveToken(tokenOverride?: string | null): string | undefined {
        if (tokenOverride === null) return undefined;
        return tokenOverride ?? this.config.token;
    }

    private buildRequestInit(options: BlizzardRequestOptions): RequestInit {
        const method = options.method ?? "GET";
        const headers: BlizzardHeaders = {
            ...(this.config.defaultHeaders ?? {}),
            ...(options.headers ?? {}),
        };

        const token = this.resolveToken(options.token);
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        let body: any;
        if (options.body !== undefined) {
            if (options.body instanceof URLSearchParams) {
                body = options.body;
            } else if (
                typeof options.body === "string" ||
                (options.body as any) instanceof ArrayBuffer
            ) {
                body = options.body as any;
            } else {
                if (!headers["Content-Type"]) {
                    headers["Content-Type"] = "application/json";
                }
                body = JSON.stringify(options.body);
            }
        }

        return {
            method,
            headers,
            body,
            signal: options.signal,
        };
    }

    async requestText(options: BlizzardRequestOptions): Promise<string> {
        const url = this.createUrl(options.path, options.query);
        const response = await this.fetchImpl(
            url,
            this.buildRequestInit(options)
        );
        const text = await response.text();

        if (!response.ok) {
            throw new BlizzardApiError(
                `Blizzard request failed: ${options.method ?? "GET"} ${url} -> ${response.status} ${response.statusText} - ${text}`
            );
        }

        return text;
    }

    async requestJson<T>(options: BlizzardRequestOptions): Promise<T> {
        const url = this.createUrl(options.path, options.query);
        const response = await this.fetchImpl(
            url,
            this.buildRequestInit(options)
        );

        if (!response.ok) {
            const text = await response.text();
            throw new BlizzardApiError(
                `Blizzard request failed: ${options.method ?? "GET"} ${url} -> ${response.status} ${response.statusText} - ${text}`
            );
        }

        return (await response.json()) as T;
    }
}
