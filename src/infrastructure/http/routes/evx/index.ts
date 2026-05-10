import { Hono } from "hono";
import { createPredictionMarketRoute } from "./create-prediction-market.route";
import { createPredictionPledgeRoute } from "./create-prediction-pledge.route";
import { findAllWalletsRoute } from "./find-all-wallets.route";
import { findEVXLeaderboardRoute } from "./find-evx-leaderboard.route";
import { findMyPredictionPledgesRoute } from "./find-my-prediction-pledges.route";
import { findPredictionMarketsRoute } from "./find-prediction-markets.route";
import { myWallet } from "./my-wallet.route";
import { predictionMarketLifecycleRoute } from "./prediction-market-lifecycle.route";

const hono = new Hono();
hono.route("/", findEVXLeaderboardRoute);
hono.route("/", findPredictionMarketsRoute);
hono.route("/", findMyPredictionPledgesRoute);
hono.route("/", createPredictionMarketRoute);
hono.route("/", createPredictionPledgeRoute);
hono.route("/", predictionMarketLifecycleRoute);
hono.route("/", findAllWalletsRoute);
hono.route("/", myWallet);

export default hono;
