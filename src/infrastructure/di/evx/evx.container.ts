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
import { type Container, createToken } from "../container";
import { DATABASE_TOKENS } from "../persistence/database.container";
import { FindAllWalletsUseCase } from "@use-cases/evx/wallets/find-all-wallets.usecase";
import { FindEVXLeaderboardUseCase } from "@use-cases/evx/wallets/find-evx-leaderboard.usecase";

export const EVX_TOKENS = {
    WalletRepository: createToken<WalletRepository>("WalletRepository"),
    PredictionMarketRepository: createToken<PredictionMarketRepository>(
        "PredictionMarketRepository"
    ),
    CreateNewWalletUseCase: createToken<CreateNewWalletUseCase>(
        "CreateNewWalletUseCase"
    ),
    FindAllWalletsUseCase: createToken<FindAllWalletsUseCase>(
        "FindAllWalletsUseCase"
    ),
    FindEVXLeaderboardUseCase: createToken<FindEVXLeaderboardUseCase>(
        "FindEVXLeaderboardUseCase"
    ),
    CreatePredictionMarketUseCase: createToken<CreatePredictionMarketUseCase>(
        "CreatePredictionMarketUseCase"
    ),
    CreatePredictionPledgeUseCase: createToken<CreatePredictionPledgeUseCase>(
        "CreatePredictionPledgeUseCase"
    ),
    FindPredictionMarketsUseCase: createToken<FindPredictionMarketsUseCase>(
        "FindPredictionMarketsUseCase"
    ),
    FindPredictionMarketByIdUseCase:
        createToken<FindPredictionMarketByIdUseCase>(
            "FindPredictionMarketByIdUseCase"
        ),
    FindMyPredictionPledgesUseCase: createToken<FindMyPredictionPledgesUseCase>(
        "FindMyPredictionPledgesUseCase"
    ),
    OpenPredictionMarketUseCase: createToken<OpenPredictionMarketUseCase>(
        "OpenPredictionMarketUseCase"
    ),
    FinalizePredictionMarketUseCase:
        createToken<FinalizePredictionMarketUseCase>(
            "FinalizePredictionMarketUseCase"
        ),
    CancelPredictionMarketUseCase: createToken<CancelPredictionMarketUseCase>(
        "CancelPredictionMarketUseCase"
    ),
} as const;

export function registerEvxDependencies(container: Container): void {
    container.singleton(
        EVX_TOKENS.WalletRepository,
        (c) =>
            new WalletRepository(c.resolve(DATABASE_TOKENS.PostgresSQLClient))
    );
    container.singleton(
        EVX_TOKENS.PredictionMarketRepository,
        (c) =>
            new PredictionMarketRepository(
                c.resolve(DATABASE_TOKENS.PostgresSQLClient)
            )
    );
    container.singleton(
        EVX_TOKENS.CreateNewWalletUseCase,
        (c) =>
            new CreateNewWalletUseCase(c.resolve(EVX_TOKENS.WalletRepository))
    );
    container.singleton(
        EVX_TOKENS.FindAllWalletsUseCase,
        (c) => new FindAllWalletsUseCase(c.resolve(EVX_TOKENS.WalletRepository))
    );
    container.singleton(
        EVX_TOKENS.FindEVXLeaderboardUseCase,
        (c) =>
            new FindEVXLeaderboardUseCase(
                c.resolve(EVX_TOKENS.WalletRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.CreatePredictionMarketUseCase,
        (c) =>
            new CreatePredictionMarketUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.CreatePredictionPledgeUseCase,
        (c) =>
            new CreatePredictionPledgeUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.FindPredictionMarketsUseCase,
        (c) =>
            new FindPredictionMarketsUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.FindPredictionMarketByIdUseCase,
        (c) =>
            new FindPredictionMarketByIdUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.FindMyPredictionPledgesUseCase,
        (c) =>
            new FindMyPredictionPledgesUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.OpenPredictionMarketUseCase,
        (c) =>
            new OpenPredictionMarketUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.FinalizePredictionMarketUseCase,
        (c) =>
            new FinalizePredictionMarketUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
    container.singleton(
        EVX_TOKENS.CancelPredictionMarketUseCase,
        (c) =>
            new CancelPredictionMarketUseCase(
                c.resolve(EVX_TOKENS.PredictionMarketRepository)
            )
    );
}
