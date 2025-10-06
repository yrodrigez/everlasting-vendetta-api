import { Context } from "hono";
import { createLogger } from "../../logging/logger";

export interface ValidationContext {
    c: Context;
    logger: ReturnType<typeof createLogger>;
    requestId: string;
    validatedData: {
        input?: unknown;
        query?: unknown;
        params?: unknown;
        headers?: unknown;
        cookies?: unknown;
    };
}

export interface ValidationResult {
    success: boolean;
    error?: {
        message: string;
        statusCode: number;
    };
}

export interface Validator {
    setNext(validator: Validator): Validator;
    validate(context: ValidationContext): Promise<ValidationResult>;
}

export abstract class BaseValidator implements Validator {
    private nextValidator?: Validator;

    setNext(validator: Validator): Validator {
        this.nextValidator = validator;
        return validator;
    }

    async validate(context: ValidationContext): Promise<ValidationResult> {
        const result = await this.doValidate(context);

        if (!result.success) {
            return result;
        }

        if (this.nextValidator) {
            return this.nextValidator.validate(context);
        }

        return { success: true };
    }

    protected abstract doValidate(context: ValidationContext): Promise<ValidationResult>;
}
