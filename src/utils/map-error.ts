import { DomainError } from "@errors/domain-error";

export class ResponseMapper {

    static success(data: object, requestId: string): Response {
        return new Response(
            JSON.stringify({ ...data, request_id: requestId }),
            { status: 200, headers: { "Content-Type": "application/json", "X-Request-ID": requestId } },
        );
    }

    static toJSON(error: DomainError | unknown, requestId: string): { error: boolean; message: string; code: string; statusCode: number; request_id: string } {
        if (error instanceof DomainError) {
            return {
                error: true,
                message: error.message,
                code: error.code,
                statusCode: error.statusCode,
                request_id: requestId,
            };
        }

        const message = (error instanceof Error || (error as { message?: string }).message ? (error as { message?: string }).message : 'An unknown error occurred') as string;
        const code = (error as { code: string })?.code ?? 'UNKNOWN_ERROR';
        const statusCode = (error as { statusCode: number })?.statusCode ?? 500;

        return {
            error: true,
            message,
            code,
            statusCode,
            request_id: requestId,
        };
    }

    static error(error: DomainError | unknown, requestId: string): Response {
        const errorData = ResponseMapper.toJSON(error, requestId);
        return new Response(
            JSON.stringify(errorData),
            { status: errorData.statusCode, headers: { "Content-Type": "application/json", "X-Request-ID": requestId } },
        );
    }
}