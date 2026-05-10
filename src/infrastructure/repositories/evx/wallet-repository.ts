import { type SQLDatabaseClientFactory } from "@database/sql/sql-database-client-factory";
import { type EVXLeaderboardEntry, type Wallet } from "@dto/evx/wallets";
import { WalletRepositoryError } from "@errors/evx/wallet-repository-error";
import { createLogger } from "@infrastructure/logging/logger";
import { type WalletPort } from "src/application/ports/evx/wallets.port";

type WalletRecord = {
    id: string;
    user_id: string;
    balance: number;
    created_at: Date;
    updated_at: Date;
};

type EVXLeaderboardRecord = {
    rank: number | string;
    user_id: string;
    wallet_id: string;
    selected_character_name: string | null;
    selected_character_avatar: string | null;
    balance: number | string;
    total_pledged: number | string;
    active_pledged: number | string;
    total_won: number | string;
    total_lost: number | string;
    total_refunded: number | string;
    net_profit: number | string;
    markets_won: number | string;
    markets_lost: number | string;
    pledge_count: number | string;
};

export class WalletRepository implements WalletPort {
    constructor(
        private readonly database: SQLDatabaseClientFactory,
        private readonly logger = createLogger("WalletRepository")
    ) {}

    async findAll(): Promise<Wallet[]> {
        const query = `SELECT id, user_id, balance, created_at, updated_at FROM evx.wallets`;
        try {
            const records = await this.database.query<WalletRecord>(query);

            const wallets: Wallet[] = records.map((record) => ({
                id: record.id,
                userId: record.user_id,
                balance: record.balance,
                createdAt: record.created_at,
                updatedAt: record.updated_at,
            }));

            return wallets;
        } catch (error) {
            this.logger.error("Error fetching wallets from database", error);
            throw new WalletRepositoryError("Failed to fetch wallets");
        }
    }

    async findLeaderboard(): Promise<EVXLeaderboardEntry[]> {
        const initialBalance = 5000;
        const query = `
            with pledge_stats as (
                select
                    wallet_id,
                    coalesce(sum(amount), 0)::int as total_pledged,
                    coalesce(sum(amount) filter (where status = 'ACTIVE'), 0)::int as active_pledged,
                    coalesce(sum(amount) filter (where status = 'WON'), 0)::int as total_won,
                    coalesce(sum(amount) filter (where status = 'LOST'), 0)::int as total_lost,
                    coalesce(sum(amount) filter (where status = 'REFUNDED'), 0)::int as total_refunded,
                    count(*)::int as pledge_count,
                    count(distinct market_id) filter (where status = 'WON')::int as markets_won,
                    count(distinct market_id) filter (where status = 'LOST')::int as markets_lost
                from evx.prediction_pledges
                group by wallet_id
            )
            select
                dense_rank() over (order by wallet.balance desc, wallet.created_at asc, wallet.id asc) as rank,
                wallet.user_id,
                wallet.id as wallet_id,
                selected_member.character->>'name' as selected_character_name,
                selected_member.character->>'avatar' as selected_character_avatar,
                wallet.balance,
                coalesce(stats.total_pledged, 0) as total_pledged,
                coalesce(stats.active_pledged, 0) as active_pledged,
                coalesce(stats.total_won, 0) as total_won,
                coalesce(stats.total_lost, 0) as total_lost,
                coalesce(stats.total_refunded, 0) as total_refunded,
                wallet.balance - $1 as net_profit,
                coalesce(stats.markets_won, 0) as markets_won,
                coalesce(stats.markets_lost, 0) as markets_lost,
                coalesce(stats.pledge_count, 0) as pledge_count
            from evx.wallets wallet
            left join pledge_stats stats on stats.wallet_id = wallet.id
            left join ev_member selected_member on selected_member.user_id = wallet.user_id
                and selected_member.is_selected = true
            order by rank asc, wallet.balance desc, wallet.created_at asc
        `;

        try {
            const records = await this.database.query<EVXLeaderboardRecord>(
                query,
                [initialBalance]
            );

            return records.map((record) => ({
                rank: this.toNumber(record.rank),
                userId: record.user_id,
                walletId: record.wallet_id,
                selectedCharacterName: record.selected_character_name,
                selectedCharacterAvatar: record.selected_character_avatar,
                balance: this.toNumber(record.balance),
                totalPledged: this.toNumber(record.total_pledged),
                activePledged: this.toNumber(record.active_pledged),
                totalWon: this.toNumber(record.total_won),
                totalLost: this.toNumber(record.total_lost),
                totalRefunded: this.toNumber(record.total_refunded),
                netProfit: this.toNumber(record.net_profit),
                marketsWon: this.toNumber(record.markets_won),
                marketsLost: this.toNumber(record.markets_lost),
                pledgeCount: this.toNumber(record.pledge_count),
            }));
        } catch (error) {
            this.logger.error(
                "Error fetching EVX leaderboard from database",
                error
            );
            throw new WalletRepositoryError("Failed to fetch EVX leaderboard");
        }
    }

    async findByUserId(userId: string): Promise<Wallet[]> {
        const query = `SELECT id, user_id, balance, created_at, updated_at FROM evx.wallets WHERE user_id = $1`;
        try {
            const records = await this.database.query<WalletRecord>(query, [
                userId,
            ]);

            const wallets: Wallet[] = records.map((record) => ({
                id: record.id,
                userId: record.user_id,
                balance: record.balance,
                createdAt: record.created_at,
                updatedAt: record.updated_at,
            }));
            return wallets;
        } catch (error) {
            this.logger.error(
                `Error fetching wallets for user ${userId} from database`,
                error
            );
            throw new WalletRepositoryError("Failed to fetch wallets for user");
        }
    }

    async findById(id: string): Promise<Wallet | null> {
        const query = `SELECT id, user_id, balance, created_at, updated_at FROM evx.wallets WHERE id = $1`;
        try {
            const records = await this.database.query<WalletRecord>(query, [
                id,
            ]);
            if (records.length === 0) {
                return null;
            }
            const record = records[0];
            const wallet: Wallet = {
                id: record.id,
                userId: record.user_id,
                balance: record.balance,
                createdAt: record.created_at,
                updatedAt: record.updated_at,
            };
            return wallet;
        } catch (error) {
            this.logger.error(
                `Error fetching wallet with id ${id} from database`,
                error
            );
            throw new WalletRepositoryError("Failed to fetch wallet by id");
        }
    }

    async create(
        wallet: Omit<Wallet, "id" | "createdAt" | "updatedAt" | "balance">
    ): Promise<Wallet> {
        const initialBalance = 5000;
        const query = `
                    with inserted_wallet as (
                        insert into evx.wallets (user_id, balance)
                        values ($1, $2)
                        on conflict (user_id) do nothing
                        returning id, user_id, balance, created_at, updated_at
                    ),
                    inserted_transaction as (
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
                        $2,
                        $2,
                        'Initial Vendetta Exchange grant'
                        from inserted_wallet
                    )
                    select id, user_id, balance, created_at, updated_at
                    from inserted_wallet

                    union all

                    select id, user_id, balance, created_at, updated_at
                    from evx.wallets
                    where user_id = $1
                        and not exists (select 1 from inserted_wallet)
                    `;
        try {
            const result = await this.database.query<WalletRecord>(query, [
                wallet.userId,
                initialBalance,
            ]);
            if (result.length === 0) {
                throw new WalletRepositoryError(
                    "Failed to create wallet: No record returned"
                );
            }
            const createdWallet: Wallet = {
                id: result[0].id,
                userId: result[0].user_id,
                balance: result[0].balance,
                createdAt: new Date(result[0].created_at),
                updatedAt: new Date(result[0].updated_at),
            };
            return createdWallet;
        } catch (error) {
            this.logger.error("Error creating wallet in database", error);
            throw new WalletRepositoryError("Failed to create wallet");
        }
    }

    async addFunds(walletId: string, amount: number): Promise<Wallet> {
        throw new Error("Method not implemented.");
    }
    async subtractFunds(walletId: string, amount: number): Promise<Wallet> {
        throw new Error("Method not implemented.");
    }

    private toNumber(value: number | string): number {
        return typeof value === "string" ? Number(value) : value;
    }
}
