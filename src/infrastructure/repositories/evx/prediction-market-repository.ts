import { type SQLDatabaseClientFactory } from "@database/sql/sql-database-client-factory";
import {
    CreatePredictionMarketInput,
    CreatePredictionPledgeInput,
    FinalizePredictionMarketInput,
    PredictionMarket,
    PredictionMarketDetails,
    PredictionMarketType,
    PredictionOutcome,
    PredictionOutcomeStats,
    PredictionPledge,
    PredictionPledgeDetails,
} from "@dto/evx/predictions";
import { PredictionMarketRepositoryError } from "@errors/evx/prediction-market-repository-error";
import { createLogger } from "@infrastructure/logging/logger";
import { type PredictionMarketPort } from "src/application/ports/evx/prediction-markets.port";

type PredictionOutcomeRecord = {
    id: string;
    market_id: string;
    label: string;
    sort_order: number;
    created_at: Date | string;
};

type PredictionMarketRecord = {
    id: string;
    reset_id: string | null;
    title: string;
    description: string | null;
    status: PredictionMarket["status"];
    closes_at: Date | string;
    resolved_outcome_id: string | null;
    created_by: string;
    created_at: Date | string;
    updated_at: Date | string;
    type: PredictionMarketType;
    outcomes: PredictionOutcomeRecord[] | string;
};

type PredictionMarketDetailsRecord = Omit<
    PredictionMarketRecord,
    "outcomes"
> & {
    outcomes: PredictionOutcomeStatsRecord[] | string;
    pledges: PredictionPledgeDetailsRecord[] | string;
    total_pool: number | string;
    pledge_count: number | string;
};

type PredictionOutcomeStatsRecord = PredictionOutcomeRecord & {
    total_pledged: number | string;
    pledge_count: number | string;
    implied_probability: number | string;
};

type PredictionPledgeDetailsRecord = {
    id: string;
    market_id: string;
    outcome_id: string;
    wallet_id: string;
    user_id: string;
    amount: number;
    status: PredictionPledge["status"];
    created_at: Date | string;
    updated_at: Date | string;
    market_title: string;
    market_status: PredictionMarket["status"];
    outcome_label: string;
};

type PredictionPledgeRecord = {
    id: string | null;
    market_id: string | null;
    outcome_id: string | null;
    wallet_id: string | null;
    amount: number | null;
    status: PredictionPledge["status"] | null;
    created_at: Date | string | null;
    updated_at: Date | string | null;
    wallet_balance_after: number | null;
    failure_reason: string | null;
};

type MutationResultRecord = {
    market_id: string | null;
    failure_reason: string | null;
};

const INITIAL_BALANCE = 5000;
const MIN_PLEDGE_AMOUNT = 50;
const MAX_PLEDGE_AMOUNT = 1000;

export class PredictionMarketRepository implements PredictionMarketPort {
    constructor(
        private readonly database: SQLDatabaseClientFactory,
        private readonly logger = createLogger("PredictionMarketRepository")
    ) {}

    async findMarkets(): Promise<PredictionMarketDetails[]> {
        try {
            const records =
                await this.database.query<PredictionMarketDetailsRecord>(
                    this.marketDetailsQuery(""),
                    []
                );

            return records.map((record) =>
                this.toPredictionMarketDetails(record)
            );
        } catch (error) {
            this.logger.error("Error fetching prediction markets", error);
            throw new PredictionMarketRepositoryError(
                "Failed to fetch prediction markets"
            );
        }
    }

    async findMarketById(
        marketId: string
    ): Promise<PredictionMarketDetails | null> {
        try {
            const records =
                await this.database.query<PredictionMarketDetailsRecord>(
                    this.marketDetailsQuery("where m.id = $1"),
                    [marketId]
                );

            if (records.length === 0) {
                return null;
            }

            return this.toPredictionMarketDetails(records[0]);
        } catch (error) {
            this.logger.error(
                `Error fetching prediction market ${marketId}`,
                error
            );
            throw new PredictionMarketRepositoryError(
                "Failed to fetch prediction market"
            );
        }
    }

    async findPledgesByUserId(
        userId: string
    ): Promise<PredictionPledgeDetails[]> {
        const query = `
            select
                pledge.id,
                pledge.market_id,
                pledge.outcome_id,
                pledge.wallet_id,
                wallet.user_id,
                pledge.amount,
                pledge.status,
                pledge.created_at,
                pledge.updated_at,
                market.title as market_title,
                market.status as market_status,
                outcome.label as outcome_label
            from evx.prediction_pledges pledge
            join evx.wallets wallet on wallet.id = pledge.wallet_id
            join evx.prediction_markets market on market.id = pledge.market_id
            join evx.prediction_outcomes outcome on outcome.id = pledge.outcome_id
            where wallet.user_id = $1
            order by pledge.created_at desc
        `;

        try {
            const records =
                await this.database.query<PredictionPledgeDetailsRecord>(
                    query,
                    [userId]
                );

            return records.map((record) =>
                this.toPredictionPledgeDetails(record)
            );
        } catch (error) {
            this.logger.error(
                `Error fetching prediction pledges for user ${userId}`,
                error
            );
            throw new PredictionMarketRepositoryError(
                "Failed to fetch prediction pledges"
            );
        }
    }

    async createMarket(
        input: CreatePredictionMarketInput,
        createdBy: string
    ): Promise<PredictionMarket> {
        const outcomeLabels = this.getOutcomeLabels(input);
        const sortOrders = outcomeLabels.map((_, index) => index + 1);
        const query = `
            with inserted_market as (
                insert into evx.prediction_markets (
                    reset_id,
                    title,
                    description,
                    status,
                    closes_at,
                    created_by,
                    type
                )
                values ($1, $2, $3, 'DRAFT', $4, $5, $6)
                returning
                    id,
                    reset_id,
                    title,
                    description,
                    status,
                    closes_at,
                    resolved_outcome_id,
                    created_by,
                    created_at,
                    updated_at,
                    type
            ),
            inserted_outcomes as (
                insert into evx.prediction_outcomes (market_id, label, sort_order)
                select inserted_market.id, outcome.label, outcome.sort_order
                from inserted_market
                cross join unnest($7::text[], $8::int[]) as outcome(label, sort_order)
                returning id, market_id, label, sort_order, created_at
            )
            select
                inserted_market.id,
                inserted_market.reset_id,
                inserted_market.title,
                inserted_market.description,
                inserted_market.status,
                inserted_market.closes_at,
                inserted_market.resolved_outcome_id,
                inserted_market.created_by,
                inserted_market.created_at,
                inserted_market.updated_at,
                inserted_market.type,
                coalesce(
                    json_agg(
                        json_build_object(
                            'id', inserted_outcomes.id,
                            'market_id', inserted_outcomes.market_id,
                            'label', inserted_outcomes.label,
                            'sort_order', inserted_outcomes.sort_order,
                            'created_at', inserted_outcomes.created_at
                        )
                        order by inserted_outcomes.sort_order
                    ) filter (where inserted_outcomes.id is not null),
                    '[]'::json
                ) as outcomes
            from inserted_market
            left join inserted_outcomes on inserted_outcomes.market_id = inserted_market.id
            group by
                inserted_market.id,
                inserted_market.reset_id,
                inserted_market.title,
                inserted_market.description,
                inserted_market.status,
                inserted_market.closes_at,
                inserted_market.resolved_outcome_id,
                inserted_market.created_by,
                inserted_market.created_at,
                inserted_market.updated_at,
                inserted_market.type
        `;

        try {
            const records = await this.database.query<PredictionMarketRecord>(
                query,
                [
                    input.resetId ?? null,
                    input.title,
                    input.description ?? null,
                    input.closesAt,
                    createdBy,
                    input.type,
                    outcomeLabels,
                    sortOrders,
                ]
            );

            if (records.length === 0) {
                throw new PredictionMarketRepositoryError(
                    "Failed to create prediction market: no record returned"
                );
            }

            return this.toPredictionMarket(records[0]);
        } catch (error) {
            if (error instanceof PredictionMarketRepositoryError) {
                throw error;
            }

            this.logger.error("Error creating prediction market", error);
            throw new PredictionMarketRepositoryError(
                "Failed to create prediction market"
            );
        }
    }

    async createPledge(
        input: CreatePredictionPledgeInput
    ): Promise<PredictionPledge> {
        if (input.amount < MIN_PLEDGE_AMOUNT) {
            throw new PredictionMarketRepositoryError(
                "Minimum pledge is 50 EVX",
                "PLEDGE_AMOUNT_TOO_LOW",
                400
            );
        }

        if (input.amount > MAX_PLEDGE_AMOUNT) {
            throw new PredictionMarketRepositoryError(
                "Maximum pledge is 1000 EVX",
                "PLEDGE_AMOUNT_TOO_HIGH",
                400
            );
        }

        const query = `
            with request as (
                select
                    $1::uuid as market_id,
                    $2::uuid as outcome_id,
                    $3::uuid as user_id,
                    $4::int as amount,
                    $5::int as initial_balance
            ),
            locked_market as (
                select id, status, closes_at
                from evx.prediction_markets
                where id = (select market_id from request)
                for update
            ),
            valid_outcome as (
                select id
                from evx.prediction_outcomes
                where id = (select outcome_id from request)
                    and market_id = (select market_id from request)
            ),
            existing_wallet as (
                select id, balance
                from evx.wallets
                where user_id = (select user_id from request)
            ),
            charged_wallet as (
                insert into evx.wallets (user_id, balance)
                select request.user_id, request.initial_balance - request.amount
                from request
                where exists (
                    select 1
                    from locked_market
                    where status = 'OPEN'
                        and closes_at > now()
                )
                    and exists (select 1 from valid_outcome)
                    and request.initial_balance >= request.amount
                on conflict (user_id) do update
                set balance = evx.wallets.balance - $4,
                    updated_at = now()
                where evx.wallets.balance >= $4
                returning id, user_id, balance, (xmax = 0) as was_inserted
            ),
            initial_transaction as (
                insert into evx.transactions (
                    wallet_id,
                    type,
                    amount,
                    balance_after,
                    description
                )
                select
                    id,
                    'INITIAL_GRANT',
                    $5,
                    $5,
                    'Initial Vendetta Exchange grant'
                from charged_wallet
                where was_inserted
            ),
            inserted_pledge as (
                insert into evx.prediction_pledges (
                    market_id,
                    outcome_id,
                    wallet_id,
                    amount,
                    status
                )
                select
                    request.market_id,
                    request.outcome_id,
                    charged_wallet.id,
                    request.amount,
                    'ACTIVE'
                from request
                cross join charged_wallet
                returning id, market_id, outcome_id, wallet_id, amount, status, created_at, updated_at
            ),
            pledge_transaction as (
                insert into evx.transactions (
                    wallet_id,
                    type,
                    amount,
                    balance_after,
                    related_market_id,
                    related_pledge_id,
                    description
                )
                select
                    inserted_pledge.wallet_id,
                    'PLEDGE_LOCK',
                    -inserted_pledge.amount,
                    charged_wallet.balance,
                    inserted_pledge.market_id,
                    inserted_pledge.id,
                    'EVX locked for prediction pledge'
                from inserted_pledge
                join charged_wallet on charged_wallet.id = inserted_pledge.wallet_id
            ),
            failure as (
                select
                    case
                        when not exists (select 1 from locked_market) then 'Market not found'
                        when exists (select 1 from locked_market where status != 'OPEN') then 'Market is not open'
                        when exists (select 1 from locked_market where closes_at <= now()) then 'Market is already closed'
                        when not exists (select 1 from valid_outcome) then 'Outcome does not belong to market'
                        when exists (select 1 from existing_wallet where balance < (select amount from request)) then 'Insufficient EVX balance'
                        else 'Insufficient EVX balance'
                    end as failure_reason
                where not exists (select 1 from inserted_pledge)
            )
            select
                inserted_pledge.id,
                inserted_pledge.market_id,
                inserted_pledge.outcome_id,
                inserted_pledge.wallet_id,
                inserted_pledge.amount,
                inserted_pledge.status,
                inserted_pledge.created_at,
                inserted_pledge.updated_at,
                charged_wallet.balance as wallet_balance_after,
                null::text as failure_reason
            from inserted_pledge
            join charged_wallet on charged_wallet.id = inserted_pledge.wallet_id

            union all

            select
                null::uuid as id,
                null::uuid as market_id,
                null::uuid as outcome_id,
                null::uuid as wallet_id,
                null::int as amount,
                null as status,
                null::timestamptz as created_at,
                null::timestamptz as updated_at,
                null::int as wallet_balance_after,
                failure.failure_reason
            from failure
        `;

        try {
            const records = await this.database.query<PredictionPledgeRecord>(
                query,
                [
                    input.marketId,
                    input.outcomeId,
                    input.userId,
                    input.amount,
                    INITIAL_BALANCE,
                ]
            );

            const record = records[0];
            if (!record) {
                throw new PredictionMarketRepositoryError(
                    "Failed to create pledge: no record returned"
                );
            }

            if (record.failure_reason) {
                throw this.toPledgeError(record.failure_reason);
            }

            return this.toPredictionPledge(record);
        } catch (error) {
            if (error instanceof PredictionMarketRepositoryError) {
                throw error;
            }

            this.logger.error("Error creating prediction pledge", error);
            throw new PredictionMarketRepositoryError(
                "Failed to create prediction pledge"
            );
        }
    }

    async openMarket(marketId: string): Promise<PredictionMarketDetails> {
        const query = `
            with locked_market as (
                select id, status
                from evx.prediction_markets
                where id = $1
                for update
            ),
            updated_market as (
                update evx.prediction_markets
                set status = 'OPEN',
                    updated_at = now()
                where id = $1
                    and exists (
                        select 1
                        from locked_market
                        where status = 'DRAFT'
                    )
                returning id
            ),
            failure as (
                select
                    case
                        when not exists (select 1 from locked_market) then 'Market not found'
                        when exists (select 1 from locked_market where status != 'DRAFT') then 'Only draft markets can be opened'
                    end as failure_reason
                where not exists (select 1 from updated_market)
            )
            select id as market_id, null::text as failure_reason
            from updated_market

            union all

            select null::uuid as market_id, failure_reason
            from failure
        `;

        try {
            const [record] = await this.database.query<MutationResultRecord>(
                query,
                [marketId]
            );

            return this.resolveMutationResult(record, "open prediction market");
        } catch (error) {
            if (error instanceof PredictionMarketRepositoryError) {
                throw error;
            }

            this.logger.error(
                `Error opening prediction market ${marketId}`,
                error
            );
            throw new PredictionMarketRepositoryError(
                "Failed to open prediction market"
            );
        }
    }

    async finalizeMarket(
        input: FinalizePredictionMarketInput
    ): Promise<PredictionMarketDetails> {
        const query = `
            with request as (
                select $1::uuid as market_id, $2::uuid as resolved_outcome_id
            ),
            locked_market as (
                select id, status
                from evx.prediction_markets
                where id = (select market_id from request)
                for update
            ),
            valid_outcome as (
                select id
                from evx.prediction_outcomes
                where id = (select resolved_outcome_id from request)
                    and market_id = (select market_id from request)
            ),
            updated_market as (
                update evx.prediction_markets
                set status = 'RESOLVED',
                    resolved_outcome_id = (select resolved_outcome_id from request),
                    updated_at = now()
                where id = (select market_id from request)
                    and exists (
                        select 1
                        from locked_market
                        where status in ('OPEN', 'LOCKED')
                    )
                    and exists (select 1 from valid_outcome)
                returning id
            ),
            active_pledges as (
                select pledge.*
                from evx.prediction_pledges pledge
                where pledge.market_id = (select market_id from request)
                    and pledge.status = 'ACTIVE'
                    and exists (select 1 from updated_market)
            ),
            pools as (
                select
                    coalesce(sum(amount), 0)::int as total_pool,
                    coalesce(sum(amount) filter (
                        where outcome_id = (select resolved_outcome_id from request)
                    ), 0)::int as winning_pool
                from active_pledges
            ),
            winner_base_payouts as (
                select
                    pledge.id as pledge_id,
                    pledge.wallet_id,
                    pledge.market_id,
                    pledge.amount,
                    floor(
                        (select total_pool from pools)::numeric * pledge.amount::numeric /
                        nullif((select winning_pool from pools), 0)
                    )::int as base_payout
                from active_pledges pledge
                where pledge.outcome_id = (select resolved_outcome_id from request)
                    and (select winning_pool from pools) > 0
            ),
            payout_remainder as (
                select coalesce(
                    (select total_pool from pools) - sum(base_payout),
                    0
                )::int as amount
                from winner_base_payouts
            ),
            ranked_winner_payouts as (
                select
                    *,
                    row_number() over (order by amount desc, pledge_id asc) as payout_rank
                from winner_base_payouts
            ),
            final_winner_payouts as (
                select
                    pledge_id,
                    wallet_id,
                    market_id,
                    base_payout + case
                        when payout_rank = 1 then (select amount from payout_remainder)
                        else 0
                    end as payout
                from ranked_winner_payouts
            ),
            updated_winning_pledges as (
                update evx.prediction_pledges pledge
                set status = 'WON',
                    updated_at = now()
                where pledge.id in (select pledge_id from final_winner_payouts)
                returning pledge.id
            ),
            updated_losing_pledges as (
                update evx.prediction_pledges pledge
                set status = 'LOST',
                    updated_at = now()
                where pledge.id in (
                    select id
                    from active_pledges
                    where outcome_id != (select resolved_outcome_id from request)
                )
                returning pledge.id
            ),
            wallet_payouts as (
                select wallet_id, sum(payout)::int as total_payout
                from final_winner_payouts
                where payout > 0
                group by wallet_id
            ),
            updated_wallets as (
                update evx.wallets wallet
                set balance = wallet.balance + wallet_payouts.total_payout,
                    updated_at = now()
                from wallet_payouts
                where wallet.id = wallet_payouts.wallet_id
                returning wallet.id, wallet.balance
            ),
            payout_transactions as (
                insert into evx.transactions (
                    wallet_id,
                    type,
                    amount,
                    balance_after,
                    related_market_id,
                    related_pledge_id,
                    description
                )
                select
                    payout.wallet_id,
                    'PLEDGE_PAYOUT',
                    payout.payout,
                    updated_wallets.balance,
                    payout.market_id,
                    payout.pledge_id,
                    'EVX payout for winning prediction pledge'
                from final_winner_payouts payout
                join updated_wallets on updated_wallets.id = payout.wallet_id
                where payout.payout > 0
            ),
            failure as (
                select
                    case
                        when not exists (select 1 from locked_market) then 'Market not found'
                        when exists (select 1 from locked_market where status not in ('OPEN', 'LOCKED')) then 'Market cannot be finalized'
                        when not exists (select 1 from valid_outcome) then 'Outcome does not belong to market'
                    end as failure_reason
                where not exists (select 1 from updated_market)
            )
            select id as market_id, null::text as failure_reason
            from updated_market

            union all

            select null::uuid as market_id, failure_reason
            from failure
        `;

        try {
            const [record] = await this.database.query<MutationResultRecord>(
                query,
                [input.marketId, input.resolvedOutcomeId]
            );

            return this.resolveMutationResult(
                record,
                "finalize prediction market"
            );
        } catch (error) {
            if (error instanceof PredictionMarketRepositoryError) {
                throw error;
            }

            this.logger.error(
                `Error finalizing prediction market ${input.marketId}`,
                error
            );
            throw new PredictionMarketRepositoryError(
                "Failed to finalize prediction market"
            );
        }
    }

    async cancelMarket(marketId: string): Promise<PredictionMarketDetails> {
        const query = `
            with locked_market as (
                select id, status
                from evx.prediction_markets
                where id = $1
                for update
            ),
            updated_market as (
                update evx.prediction_markets
                set status = 'CANCELLED',
                    updated_at = now()
                where id = $1
                    and exists (
                        select 1
                        from locked_market
                        where status in ('DRAFT', 'OPEN', 'LOCKED')
                    )
                returning id
            ),
            refundable_pledges as (
                select pledge.*
                from evx.prediction_pledges pledge
                where pledge.market_id = $1
                    and pledge.status = 'ACTIVE'
                    and exists (select 1 from updated_market)
            ),
            refunded_pledges as (
                update evx.prediction_pledges pledge
                set status = 'REFUNDED',
                    updated_at = now()
                where pledge.id in (select id from refundable_pledges)
                returning pledge.id, pledge.wallet_id, pledge.market_id, pledge.amount
            ),
            wallet_refunds as (
                select wallet_id, sum(amount)::int as total_refund
                from refunded_pledges
                group by wallet_id
            ),
            updated_wallets as (
                update evx.wallets wallet
                set balance = wallet.balance + wallet_refunds.total_refund,
                    updated_at = now()
                from wallet_refunds
                where wallet.id = wallet_refunds.wallet_id
                returning wallet.id, wallet.balance
            ),
            refund_transactions as (
                insert into evx.transactions (
                    wallet_id,
                    type,
                    amount,
                    balance_after,
                    related_market_id,
                    related_pledge_id,
                    description
                )
                select
                    pledge.wallet_id,
                    'PLEDGE_REFUND',
                    pledge.amount,
                    updated_wallets.balance,
                    pledge.market_id,
                    pledge.id,
                    'EVX refund for cancelled prediction market'
                from refunded_pledges pledge
                join updated_wallets on updated_wallets.id = pledge.wallet_id
            ),
            failure as (
                select
                    case
                        when not exists (select 1 from locked_market) then 'Market not found'
                        when exists (select 1 from locked_market where status in ('RESOLVED', 'CANCELLED')) then 'Market cannot be cancelled'
                    end as failure_reason
                where not exists (select 1 from updated_market)
            )
            select id as market_id, null::text as failure_reason
            from updated_market

            union all

            select null::uuid as market_id, failure_reason
            from failure
        `;

        try {
            const [record] = await this.database.query<MutationResultRecord>(
                query,
                [marketId]
            );

            return this.resolveMutationResult(
                record,
                "cancel prediction market"
            );
        } catch (error) {
            if (error instanceof PredictionMarketRepositoryError) {
                throw error;
            }

            this.logger.error(
                `Error cancelling prediction market ${marketId}`,
                error
            );
            throw new PredictionMarketRepositoryError(
                "Failed to cancel prediction market"
            );
        }
    }

    private marketDetailsQuery(filter: string): string {
        return `
            with market_totals as (
                select
                    market_id,
                    coalesce(sum(amount) filter (
                        where status in ('ACTIVE', 'WON', 'LOST')
                    ), 0)::int as total_pool,
                    count(*) filter (
                        where status in ('ACTIVE', 'WON', 'LOST')
                    )::int as pledge_count
                from evx.prediction_pledges
                group by market_id
            ),
            outcome_totals as (
                select
                    market_id,
                    outcome_id,
                    coalesce(sum(amount) filter (
                        where status in ('ACTIVE', 'WON', 'LOST')
                    ), 0)::int as total_pledged,
                    count(*) filter (
                        where status in ('ACTIVE', 'WON', 'LOST')
                    )::int as pledge_count
                from evx.prediction_pledges
                group by market_id, outcome_id
            )
            select
                m.id,
                m.reset_id,
                m.title,
                m.description,
                m.status,
                m.closes_at,
                m.resolved_outcome_id,
                m.created_by,
                m.created_at,
                m.updated_at,
                m.type,
                coalesce(mt.total_pool, 0) as total_pool,
                coalesce(mt.pledge_count, 0) as pledge_count,
                coalesce((
                    select json_agg(
                        json_build_object(
                            'id', outcome.id,
                            'market_id', outcome.market_id,
                            'label', outcome.label,
                            'sort_order', outcome.sort_order,
                            'created_at', outcome.created_at,
                            'total_pledged', coalesce(ot.total_pledged, 0),
                            'pledge_count', coalesce(ot.pledge_count, 0),
                            'implied_probability', case
                                when coalesce(mt.total_pool, 0) = 0 then 0
                                else round(coalesce(ot.total_pledged, 0)::numeric / mt.total_pool, 4)
                            end
                        )
                        order by outcome.sort_order
                    )
                    from evx.prediction_outcomes outcome
                    left join outcome_totals ot on ot.outcome_id = outcome.id
                    where outcome.market_id = m.id
                ), '[]'::json) as outcomes,
                coalesce((
                    select json_agg(
                        json_build_object(
                            'id', pledge.id,
                            'market_id', pledge.market_id,
                            'outcome_id', pledge.outcome_id,
                            'wallet_id', pledge.wallet_id,
                            'user_id', wallet.user_id,
                            'amount', pledge.amount,
                            'status', pledge.status,
                            'created_at', pledge.created_at,
                            'updated_at', pledge.updated_at,
                            'market_title', m.title,
                            'market_status', m.status,
                            'outcome_label', outcome.label
                        )
                        order by pledge.created_at desc
                    )
                    from evx.prediction_pledges pledge
                    join evx.wallets wallet on wallet.id = pledge.wallet_id
                    join evx.prediction_outcomes outcome on outcome.id = pledge.outcome_id
                    where pledge.market_id = m.id
                ), '[]'::json) as pledges
            from evx.prediction_markets m
            left join market_totals mt on mt.market_id = m.id
            ${filter}
            order by m.created_at desc
        `;
    }

    private async resolveMutationResult(
        record: MutationResultRecord | undefined,
        action: string
    ): Promise<PredictionMarketDetails> {
        if (!record) {
            throw new PredictionMarketRepositoryError(
                `Failed to ${action}: no record returned`
            );
        }

        if (record.failure_reason) {
            throw this.toMarketMutationError(record.failure_reason);
        }

        if (!record.market_id) {
            throw new PredictionMarketRepositoryError(
                `Failed to ${action}: no market returned`
            );
        }

        const market = await this.findMarketById(record.market_id);
        if (!market) {
            throw new PredictionMarketRepositoryError(
                `Failed to ${action}: market not found after mutation`
            );
        }

        return market;
    }

    private getOutcomeLabels(input: CreatePredictionMarketInput): string[] {
        if (input.type === "YES_NO") {
            return ["YES", "NO"];
        }

        return input.outcomes ?? [];
    }

    private toPredictionMarket(
        record: PredictionMarketRecord
    ): PredictionMarket {
        const outcomes =
            typeof record.outcomes === "string"
                ? JSON.parse(record.outcomes)
                : record.outcomes;

        return {
            id: record.id,
            resetId: record.reset_id,
            title: record.title,
            description: record.description,
            status: record.status,
            closesAt: new Date(record.closes_at),
            resolvedOutcomeId: record.resolved_outcome_id,
            createdBy: record.created_by,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            type: record.type,
            outcomes: outcomes.map((outcome: PredictionOutcomeRecord) =>
                this.toPredictionOutcome(outcome)
            ),
        };
    }

    private toPredictionMarketDetails(
        record: PredictionMarketDetailsRecord
    ): PredictionMarketDetails {
        const outcomes = this.parseJsonArray<PredictionOutcomeStatsRecord>(
            record.outcomes
        );
        const pledges = this.parseJsonArray<PredictionPledgeDetailsRecord>(
            record.pledges
        );

        return {
            id: record.id,
            resetId: record.reset_id,
            title: record.title,
            description: record.description,
            status: record.status,
            closesAt: new Date(record.closes_at),
            resolvedOutcomeId: record.resolved_outcome_id,
            createdBy: record.created_by,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            type: record.type,
            outcomes: outcomes.map((outcome) =>
                this.toPredictionOutcomeStats(outcome)
            ),
            pledges: pledges.map((pledge) =>
                this.toPredictionPledgeDetails(pledge)
            ),
            totalPool: this.toNumber(record.total_pool),
            pledgeCount: this.toNumber(record.pledge_count),
        };
    }

    private toPredictionOutcome(
        record: PredictionOutcomeRecord
    ): PredictionOutcome {
        return {
            id: record.id,
            marketId: record.market_id,
            label: record.label,
            sortOrder: record.sort_order,
            createdAt: new Date(record.created_at),
        };
    }

    private toPredictionOutcomeStats(
        record: PredictionOutcomeStatsRecord
    ): PredictionOutcomeStats {
        return {
            ...this.toPredictionOutcome(record),
            totalPledged: this.toNumber(record.total_pledged),
            pledgeCount: this.toNumber(record.pledge_count),
            impliedProbability: this.toNumber(record.implied_probability),
        };
    }

    private toPredictionPledgeDetails(
        record: PredictionPledgeDetailsRecord
    ): PredictionPledgeDetails {
        return {
            id: record.id,
            marketId: record.market_id,
            outcomeId: record.outcome_id,
            walletId: record.wallet_id,
            userId: record.user_id,
            amount: record.amount,
            status: record.status,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            marketTitle: record.market_title,
            marketStatus: record.market_status,
            outcomeLabel: record.outcome_label,
        };
    }

    private toPredictionPledge(
        record: PredictionPledgeRecord
    ): PredictionPledge {
        if (
            !record.id ||
            !record.market_id ||
            !record.outcome_id ||
            !record.wallet_id ||
            record.amount === null ||
            !record.status ||
            !record.created_at ||
            !record.updated_at ||
            record.wallet_balance_after === null
        ) {
            throw new PredictionMarketRepositoryError(
                "Failed to create pledge: incomplete record returned"
            );
        }

        return {
            id: record.id,
            marketId: record.market_id,
            outcomeId: record.outcome_id,
            walletId: record.wallet_id,
            amount: record.amount,
            status: record.status,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            walletBalanceAfter: record.wallet_balance_after,
        };
    }

    private toPledgeError(reason: string): PredictionMarketRepositoryError {
        const codeByReason: Record<string, string> = {
            "Market not found": "MARKET_NOT_FOUND",
            "Market is not open": "MARKET_NOT_OPEN",
            "Market is already closed": "MARKET_CLOSED",
            "Outcome does not belong to market": "OUTCOME_NOT_FOUND",
            "Insufficient EVX balance": "INSUFFICIENT_EVX_BALANCE",
        };

        return new PredictionMarketRepositoryError(
            reason,
            codeByReason[reason] ?? "PLEDGE_REJECTED",
            400
        );
    }

    private toMarketMutationError(
        reason: string
    ): PredictionMarketRepositoryError {
        const codeByReason: Record<
            string,
            { code: string; statusCode: number }
        > = {
            "Market not found": { code: "MARKET_NOT_FOUND", statusCode: 404 },
            "Only draft markets can be opened": {
                code: "MARKET_NOT_DRAFT",
                statusCode: 400,
            },
            "Market cannot be finalized": {
                code: "MARKET_CANNOT_BE_FINALIZED",
                statusCode: 400,
            },
            "Outcome does not belong to market": {
                code: "OUTCOME_NOT_FOUND",
                statusCode: 400,
            },
            "Market cannot be cancelled": {
                code: "MARKET_CANNOT_BE_CANCELLED",
                statusCode: 400,
            },
        };

        const mapped = codeByReason[reason] ?? {
            code: "MARKET_MUTATION_REJECTED",
            statusCode: 400,
        };

        return new PredictionMarketRepositoryError(
            reason,
            mapped.code,
            mapped.statusCode
        );
    }

    private parseJsonArray<T>(value: T[] | string): T[] {
        return typeof value === "string" ? JSON.parse(value) : value;
    }

    private toNumber(value: number | string): number {
        return typeof value === "string" ? Number(value) : value;
    }
}
