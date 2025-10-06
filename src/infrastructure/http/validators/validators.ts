import { ZodTypeAny } from "zod/v3";
import { BaseValidator, ValidationContext, ValidationResult } from "./validator-chain";

export class BodyValidator extends BaseValidator {
    constructor(private schema?: ZodTypeAny) {
        super();
    }

    protected async doValidate(context: ValidationContext): Promise<ValidationResult> {
        const { c, logger, requestId } = context;

        // Skip body validation for GET/DELETE
        if (c.req.method === "GET" || c.req.method === "DELETE") {
            context.validatedData.input = {};
            return { success: true };
        }

        if (!this.schema) {
            // No schema, try to parse JSON or use empty object
            try {
                context.validatedData.input = await c.req.json();
            } catch {
                context.validatedData.input = {};
            }
            return { success: true };
        }

        // Parse JSON body
        let body;
        try {
            body = await c.req.json();
        } catch (jsonError) {
            logger.error("Failed to parse JSON body", jsonError);
            return {
                success: false,
                error: {
                    message: "Invalid JSON in request body",
                    statusCode: 400,
                },
            };
        }

        // Validate with schema
        const parsed = this.schema.safeParse(body);

        if (!parsed.success) {
            logger.error("Body validation failed", {
                errors: parsed.error.issues.map(issue => issue.message).join("; "),
            });
            return {
                success: false,
                error: {
                    message: "Invalid request body",
                    statusCode: 400,
                },
            };
        }

        context.validatedData.input = parsed.data;
        return { success: true };
    }
}

export class QueryValidator extends BaseValidator {
    constructor(private schema?: ZodTypeAny) {
        super();
    }

    protected async doValidate(context: ValidationContext): Promise<ValidationResult> {
        const { c, logger } = context;

        if (!this.schema) {
            context.validatedData.query = {};
            return { success: true };
        }

        const queryParsed = this.schema.safeParse(c.req.query());

        if (!queryParsed.success) {
            logger.error("Query validation failed", {
                errors: queryParsed.error.issues.map(issue => issue.message).join("; "),
            });
            return {
                success: false,
                error: {
                    message: "Invalid query parameters",
                    statusCode: 400,
                },
            };
        }

        context.validatedData.query = queryParsed.data;
        return { success: true };
    }
}

export class ParamsValidator extends BaseValidator {
    constructor(private schema?: ZodTypeAny) {
        super();
    }

    protected async doValidate(context: ValidationContext): Promise<ValidationResult> {
        const { c, logger } = context;

        if (!this.schema) {
            context.validatedData.params = {};
            return { success: true };
        }

        const paramsParsed = this.schema.safeParse(c.req.param());

        if (!paramsParsed.success) {
            logger.error("Params validation failed", {
                errors: paramsParsed.error.issues.map(issue => issue.message).join("; "),
            });
            return {
                success: false,
                error: {
                    message: "Invalid path parameters",
                    statusCode: 400,
                },
            };
        }

        context.validatedData.params = paramsParsed.data;
        return { success: true };
    }
}

export class HeadersValidator extends BaseValidator {
    constructor(private schema?: ZodTypeAny) {
        super();
    }

    protected async doValidate(context: ValidationContext): Promise<ValidationResult> {
        const { c, logger } = context;

        if (!this.schema) {
            context.validatedData.headers = {};
            return { success: true };
        }

        const allHeaders = Object.fromEntries(
            [...c.req.raw.headers.entries()].map(([k, v]) => [k.toLowerCase(), v])
        );

        const headersParsed = this.schema.safeParse(allHeaders);

        if (!headersParsed.success) {
            logger.error("Headers validation failed", {
                errors: headersParsed.error.issues.map(issue => issue.message).join("; "),
            });
            return {
                success: false,
                error: {
                    message: "Invalid headers",
                    statusCode: 400,
                },
            };
        }

        context.validatedData.headers = headersParsed.data;
        return { success: true };
    }
}


export class CookiesValidator extends BaseValidator {
    constructor(private schema?: ZodTypeAny) {
        super();
    }

    protected async doValidate(context: ValidationContext): Promise<ValidationResult> {
        const { c, logger } = context;

        if (!this.schema) {
            context.validatedData.cookies = {};
            return { success: true };
        }

        const allCookies = c.req.raw.headers.get('cookie')
            ?.split(';')
            .reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                if (key && value) {
                    acc[key] = decodeURIComponent(value);
                }
                return acc;
            }, {} as Record<string, string>) || {};
            
            console.log("All Cookies:", allCookies);

        const cookiesParsed = this.schema.safeParse(allCookies);

        if (!cookiesParsed.success) {
            logger.error("Cookies validation failed", {
                errors: cookiesParsed.error.issues.map(issue => issue.message).join("; "),
            });
            return {
                success: false,
                error: {
                    message: "Invalid cookies",
                    statusCode: 400,
                },
            };
        }

        context.validatedData.cookies = cookiesParsed.data;
        return { success: true };
    }
}
