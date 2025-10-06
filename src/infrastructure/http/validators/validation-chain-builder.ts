import { ZodSchema, ZodTypeAny } from "zod/v3";
import { Validator } from "./validator-chain";
import {
    BodyValidator,
    QueryValidator,
    ParamsValidator,
    HeadersValidator,
    CookiesValidator,
} from "./validators";

export interface ValidationSchemas {
    inputSchema?: ZodTypeAny;
    querySchema?: ZodTypeAny;
    paramsSchema?: ZodTypeAny;
    headersSchema?: ZodTypeAny;
    cookiesSchema?: ZodTypeAny;
}

export class ValidationChainBuilder {
    static build(schemas: ValidationSchemas): Validator {
        const bodyValidator = new BodyValidator(schemas.inputSchema);
        const queryValidator = new QueryValidator(schemas.querySchema);
        const paramsValidator = new ParamsValidator(schemas.paramsSchema);
        const headersValidator = new HeadersValidator(schemas.headersSchema);
        const cookiesValidator = new CookiesValidator(schemas.cookiesSchema);

        // Build the chain
        bodyValidator
            .setNext(queryValidator)
            .setNext(paramsValidator)
            .setNext(headersValidator)
            .setNext(cookiesValidator);

        return bodyValidator;
    }
}
