# EVX API Documentation

EVX, also called VX or Vendetta Exchange, is the prediction-market feature for guild members. All endpoints below are mounted under `/api/evx`.

## Auth

All endpoints require an authenticated bearer token:

```http
Authorization: Bearer <access_token>
```

Every EVX endpoint requires `isGuildMember === true`. The API returns `403` if the user is banned or is not a guild member.

Admin market actions require the `GUILD_MASTER` role:

- Create market
- Open market
- Finalize market
- Cancel market

## Response Shape

Successful responses are wrapped with `request_id`:

```json
{
    "request_id": "uuid",
    "market": {}
}
```

Error responses generally look like:

```json
{
    "error": true,
    "message": "Market not found",
    "code": "MARKET_NOT_FOUND",
    "statusCode": 404,
    "request_id": "uuid"
}
```

## Market Lifecycle

Markets move through these statuses:

- `DRAFT`: created, not pledgeable.
- `OPEN`: guild members can pledge.
- `LOCKED`: reserved state for closed/pending-resolution markets.
- `RESOLVED`: finalized, winners have been paid.
- `CANCELLED`: cancelled, active pledges have been refunded.

Create market starts as `DRAFT`. A `GUILD_MASTER` must open it before pledges can be created.

## Payout Model

EVX uses a pari-mutuel payout model:

- Users pledge EVX on outcomes.
- On finalize, the total active pool is paid to winning pledges proportionally.
- Losing pledges are marked `LOST`.
- Winning pledges are marked `WON`.
- Payout transactions use `PLEDGE_PAYOUT`.
- Cancelled active pledges are refunded with `PLEDGE_REFUND`.

Example:

- YES pool: `300`
- NO pool: `700`
- Total pool: `1000`
- YES wins
- A user who pledged `100` on YES gets approximately `333` EVX.

Integer rounding remainder is assigned deterministically by the backend.

## Types

### Market Status

```ts
type PredictionMarketStatus =
    | "DRAFT"
    | "OPEN"
    | "LOCKED"
    | "RESOLVED"
    | "CANCELLED";
```

### Market Type

```ts
type PredictionMarketType = "YES_NO" | "MULTIPLE_CHOICE" | "NUMERIC_RANGE";
```

### Pledge Status

```ts
type PredictionPledgeStatus =
    | "ACTIVE"
    | "CANCELLED"
    | "WON"
    | "LOST"
    | "REFUNDED";
```

### Market Details

```ts
type PredictionMarketDetails = {
    id: string;
    resetId: string | null;
    title: string;
    description: string | null;
    status: PredictionMarketStatus;
    closesAt: string;
    resolvedOutcomeId: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    type: PredictionMarketType;
    totalPool: number;
    pledgeCount: number;
    outcomes: PredictionOutcomeStats[];
    pledges: PredictionPledgeDetails[];
};
```

### Outcome Stats

```ts
type PredictionOutcomeStats = {
    id: string;
    marketId: string;
    label: string;
    sortOrder: number;
    createdAt: string;
    totalPledged: number;
    pledgeCount: number;
    impliedProbability: number;
};
```

### Pledge Details

```ts
type PredictionPledgeDetails = {
    id: string;
    marketId: string;
    outcomeId: string;
    walletId: string;
    userId: string;
    amount: number;
    status: PredictionPledgeStatus;
    createdAt: string;
    updatedAt: string;
    marketTitle: string;
    marketStatus: PredictionMarketStatus;
    outcomeLabel: string;
};
```

## Endpoints

### Get Current Wallet

Creates the current user's wallet if it does not exist. New wallets receive `5000` EVX.

```http
POST /api/evx/wallets/me
```

#### Response

```json
{
    "wallet": {
        "id": "uuid",
        "userId": "uuid",
        "balance": 5000,
        "createdAt": "2026-05-10T00:00:00.000Z",
        "updatedAt": "2026-05-10T00:00:00.000Z"
    },
    "request_id": "uuid"
}
```

### Get All Wallets

Admin-only wallet list. Requires `isAdmin === true` in addition to guild membership.

```http
GET /api/evx/wallets
```

#### Response

```json
{
    "wallets": [
        {
            "id": "uuid",
            "userId": "uuid",
            "balance": 5000,
            "createdAt": "2026-05-10T00:00:00.000Z",
            "updatedAt": "2026-05-10T00:00:00.000Z"
        }
    ],
    "request_id": "uuid"
}
```

### Get Leaderboard

Returns the public EVX leaderboard for guild members. This endpoint does not require `GUILD_MASTER`.

Leaderboard ranking is based on current wallet balance, descending. Ties are ordered by oldest wallet and then wallet ID for stable ordering.

```http
GET /api/evx/leaderboard
```

#### Response

```json
{
    "leaderboard": [
        {
            "rank": 1,
            "userId": "uuid",
            "walletId": "uuid",
            "selectedCharacterName": "Alveric",
            "selectedCharacterAvatar": "https://render.worldofwarcraft.com/.../avatar.jpg",
            "balance": 7420,
            "totalPledged": 1800,
            "activePledged": 300,
            "totalWon": 600,
            "totalLost": 900,
            "totalRefunded": 300,
            "netProfit": 2420,
            "marketsWon": 4,
            "marketsLost": 2,
            "pledgeCount": 9
        }
    ],
    "request_id": "uuid"
}
```

#### Field Notes

- `balance`: current EVX wallet balance.
- `selectedCharacterName`: selected character name for display, or `null` if the user has none selected.
- `selectedCharacterAvatar`: selected character avatar URL for display, or `null` if the user has none selected.
- `netProfit`: `balance - 5000`, based on the initial wallet grant.
- `totalPledged`: total EVX pledged across all pledge statuses.
- `activePledged`: EVX currently locked in active pledges.
- `totalWon`: original stake amount on pledges that ended as `WON`.
- `totalLost`: original stake amount on pledges that ended as `LOST`.
- `totalRefunded`: original stake amount on refunded pledges.
- `marketsWon`: distinct markets where the user has at least one `WON` pledge.
- `marketsLost`: distinct markets where the user has at least one `LOST` pledge.
- `pledgeCount`: total number of pledges created by this wallet.

### Get Markets

Returns all markets with outcomes, aggregate pool data, and pledges.

```http
GET /api/evx/markets
```

#### Response

```json
{
    "markets": [
        {
            "id": "uuid",
            "resetId": null,
            "title": "Will we clear the raid?",
            "description": "Prediction closes before raid start.",
            "status": "OPEN",
            "closesAt": "2026-06-01T00:00:00.000Z",
            "resolvedOutcomeId": null,
            "createdBy": "uuid",
            "createdAt": "2026-05-10T00:00:00.000Z",
            "updatedAt": "2026-05-10T00:00:00.000Z",
            "type": "YES_NO",
            "totalPool": 1000,
            "pledgeCount": 2,
            "outcomes": [
                {
                    "id": "uuid",
                    "marketId": "uuid",
                    "label": "YES",
                    "sortOrder": 1,
                    "createdAt": "2026-05-10T00:00:00.000Z",
                    "totalPledged": 300,
                    "pledgeCount": 1,
                    "impliedProbability": 0.3
                }
            ],
            "pledges": []
        }
    ],
    "request_id": "uuid"
}
```

### Get Market By ID

Returns a single market with outcomes, aggregate pool data, and pledges.

```http
GET /api/evx/markets/:marketId
```

#### Path Params

- `marketId`: UUID

#### Response

```json
{
    "market": {
        "id": "uuid",
        "title": "Will we clear the raid?",
        "status": "OPEN",
        "type": "YES_NO",
        "totalPool": 1000,
        "pledgeCount": 2,
        "outcomes": [],
        "pledges": []
    },
    "request_id": "uuid"
}
```

### Create Market

Requires `GUILD_MASTER`.

```http
POST /api/evx/markets
```

#### Body

```json
{
    "resetId": "uuid",
    "title": "Will we clear the raid?",
    "description": "Prediction closes before raid start.",
    "closesAt": "2026-06-01T00:00:00.000Z",
    "type": "YES_NO"
}
```

For `YES_NO`, do not send `outcomes`. The backend auto-creates `YES` and `NO`.

For `MULTIPLE_CHOICE` and `NUMERIC_RANGE`, send at least two outcomes:

```json
{
    "title": "Which boss dies first?",
    "closesAt": "2026-06-01T00:00:00.000Z",
    "type": "MULTIPLE_CHOICE",
    "outcomes": ["Boss A", "Boss B", "Boss C"]
}
```

#### Response

New markets are created as `DRAFT`.

```json
{
    "market": {
        "id": "uuid",
        "status": "DRAFT",
        "type": "YES_NO",
        "outcomes": [
            {
                "id": "uuid",
                "label": "YES",
                "sortOrder": 1
            },
            {
                "id": "uuid",
                "label": "NO",
                "sortOrder": 2
            }
        ]
    },
    "request_id": "uuid"
}
```

### Open Market

Requires `GUILD_MASTER`.

Transitions a market from `DRAFT` to `OPEN`.

```http
PATCH /api/evx/markets/:marketId/open
```

#### Response

```json
{
    "market": {
        "id": "uuid",
        "status": "OPEN",
        "outcomes": [],
        "pledges": []
    },
    "request_id": "uuid"
}
```

### Create Pledge

Creates a pledge on an open market.

```http
POST /api/evx/markets/:marketId/pledges
```

#### Rules

- Market must be `OPEN`.
- Market `closesAt` must be in the future.
- Outcome must belong to the market.
- Minimum pledge is `50` EVX.
- Maximum pledge is `1000` EVX.
- User wallet is auto-created with `5000` EVX if missing.
- User must have sufficient EVX balance.

#### Body

```json
{
    "outcomeId": "uuid",
    "amount": 100
}
```

#### Response

```json
{
    "pledge": {
        "id": "uuid",
        "marketId": "uuid",
        "outcomeId": "uuid",
        "walletId": "uuid",
        "amount": 100,
        "status": "ACTIVE",
        "createdAt": "2026-05-10T00:00:00.000Z",
        "updatedAt": "2026-05-10T00:00:00.000Z",
        "walletBalanceAfter": 4900
    },
    "request_id": "uuid"
}
```

### Get My Pledges

Returns pledges for the current user.

```http
GET /api/evx/pledges/me
```

#### Response

```json
{
    "pledges": [
        {
            "id": "uuid",
            "marketId": "uuid",
            "outcomeId": "uuid",
            "walletId": "uuid",
            "userId": "uuid",
            "amount": 100,
            "status": "ACTIVE",
            "createdAt": "2026-05-10T00:00:00.000Z",
            "updatedAt": "2026-05-10T00:00:00.000Z",
            "marketTitle": "Will we clear the raid?",
            "marketStatus": "OPEN",
            "outcomeLabel": "YES"
        }
    ],
    "request_id": "uuid"
}
```

### Finalize Market

Requires `GUILD_MASTER`.

Resolves a market and pays winners.

```http
POST /api/evx/markets/:marketId/finalize
```

#### Body

```json
{
    "resolvedOutcomeId": "uuid"
}
```

#### Rules

- Market must be `OPEN` or `LOCKED`.
- Resolved outcome must belong to the market.
- Active pledges on the winning outcome become `WON`.
- Active pledges on losing outcomes become `LOST`.
- Winner wallets receive payouts.
- Market becomes `RESOLVED`.

#### Response

```json
{
    "market": {
        "id": "uuid",
        "status": "RESOLVED",
        "resolvedOutcomeId": "uuid",
        "outcomes": [],
        "pledges": []
    },
    "request_id": "uuid"
}
```

### Cancel Market

Requires `GUILD_MASTER`.

Cancels a market and refunds active pledges.

```http
POST /api/evx/markets/:marketId/cancel
```

#### Rules

- Market must be `DRAFT`, `OPEN`, or `LOCKED`.
- Active pledges become `REFUNDED`.
- Wallets receive the original pledged amount back.
- Market becomes `CANCELLED`.

#### Response

```json
{
    "market": {
        "id": "uuid",
        "status": "CANCELLED",
        "outcomes": [],
        "pledges": []
    },
    "request_id": "uuid"
}
```

## Common Error Codes

```ts
type EvxErrorCode =
    | "UNAUTHORIZED"
    | "INVALID_TOKEN"
    | "MARKET_NOT_FOUND"
    | "MARKET_NOT_DRAFT"
    | "MARKET_NOT_OPEN"
    | "MARKET_CLOSED"
    | "MARKET_CANNOT_BE_FINALIZED"
    | "MARKET_CANNOT_BE_CANCELLED"
    | "OUTCOME_NOT_FOUND"
    | "PLEDGE_AMOUNT_TOO_LOW"
    | "PLEDGE_AMOUNT_TOO_HIGH"
    | "INSUFFICIENT_EVX_BALANCE";
```

## Frontend Recommendations

- Call `POST /wallets/me` when entering the VX section to ensure the user has a wallet and balance.
- Use `GET /markets` for the market list page.
- Use `GET /markets/:marketId` for detail pages after creating pledges, finalizing, or cancelling.
- Disable pledge UI unless `market.status === "OPEN"` and `new Date(market.closesAt) > new Date()`.
- Hide or disable admin controls unless the token/user context has `GUILD_MASTER`.
- Use `outcome.totalPledged` and `outcome.impliedProbability` to display market odds.
- Use `GET /pledges/me` for the user's portfolio/history view.
- Use `GET /leaderboard` for the global EVX ranking view. Rank is already computed server-side.
