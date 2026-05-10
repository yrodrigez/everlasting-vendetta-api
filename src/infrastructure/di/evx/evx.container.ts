import { SQLDatabaseClientFactory } from "@database/sql/sql-database-client-factory";
import { PredictionMarketRepository } from "@infrastructure/repositories/evx/prediction-market-repository";
import { CancelPredictionMarketUseCase } from "@use-cases/evx/predictions/cancel-prediction-market.usecase";
import { WalletRepository } from "@infrastructure/repositories/evx/wallet-repository";
import { CreatePredictionMarketUseCase } from "@use-cases/evx/predictions/create-prediction-market.usecase";
import { CreatePredictionPledgeUseCase } from "@use-cases/evx/predictions/create-prediction-pledge.usecase";
import { FinalizePredictionMarketUseCase } from "@use-cases/evx/predictions/finalize-prediction-market.usecase";
import { FindMyPredictionPledgesUseCase } from "@use-cases/evx/predictions/find-my-prediction-pledges.usecase";
import { FindPredictionMarketByIdUseCase } from "@use-cases/evx/predictions/find-prediction-market-by-id.usecase";
import { FindPredictionMarketsUseCase } from "@use-cases/evx/predictions/find-prediction-markets.usecase";
import { OpenPredictionMarketUseCase } from "@use-cases/evx/predictions/open-prediction-market.usecase";
import { CreateNewWalletUseCase } from "@use-cases/evx/wallets/create-new-wallet.usecase";
import { Container } from "../container";
import { FindAllWalletsUseCase } from "@use-cases/evx/wallets/find-all-wallets.usecase";
import { FindEVXLeaderboardUseCase } from "@use-cases/evx/wallets/find-evx-leaderboard.usecase";

export const evxContainer = new Container();

evxContainer.singleton("DatabaseClient", () =>
    SQLDatabaseClientFactory.getInstance()
);
evxContainer.singleton(
    "WalletRepository",
    (c) => new WalletRepository(c.resolve("DatabaseClient"))
);
evxContainer.singleton(
    "PredictionMarketRepository",
    (c) => new PredictionMarketRepository(c.resolve("DatabaseClient"))
);
evxContainer.singleton(
    "CreateNewWalletUseCase",
    (c) => new CreateNewWalletUseCase(c.resolve("WalletRepository"))
);
evxContainer.singleton(
    "FindAllWalletsUseCase",
    (c) => new FindAllWalletsUseCase(c.resolve("WalletRepository"))
);
evxContainer.singleton(
    "FindEVXLeaderboardUseCase",
    (c) => new FindEVXLeaderboardUseCase(c.resolve("WalletRepository"))
);
evxContainer.singleton(
    "CreatePredictionMarketUseCase",
    (c) =>
        new CreatePredictionMarketUseCase(
            c.resolve("PredictionMarketRepository")
        )
);
evxContainer.singleton(
    "CreatePredictionPledgeUseCase",
    (c) =>
        new CreatePredictionPledgeUseCase(
            c.resolve("PredictionMarketRepository")
        )
);
evxContainer.singleton(
    "FindPredictionMarketsUseCase",
    (c) =>
        new FindPredictionMarketsUseCase(
            c.resolve("PredictionMarketRepository")
        )
);
evxContainer.singleton(
    "FindPredictionMarketByIdUseCase",
    (c) =>
        new FindPredictionMarketByIdUseCase(
            c.resolve("PredictionMarketRepository")
        )
);
evxContainer.singleton(
    "FindMyPredictionPledgesUseCase",
    (c) =>
        new FindMyPredictionPledgesUseCase(
            c.resolve("PredictionMarketRepository")
        )
);
evxContainer.singleton(
    "OpenPredictionMarketUseCase",
    (c) =>
        new OpenPredictionMarketUseCase(c.resolve("PredictionMarketRepository"))
);
evxContainer.singleton(
    "FinalizePredictionMarketUseCase",
    (c) =>
        new FinalizePredictionMarketUseCase(
            c.resolve("PredictionMarketRepository")
        )
);
evxContainer.singleton(
    "CancelPredictionMarketUseCase",
    (c) =>
        new CancelPredictionMarketUseCase(
            c.resolve("PredictionMarketRepository")
        )
);
