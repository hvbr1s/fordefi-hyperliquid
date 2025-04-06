# Hyperliquid-Fordefi Integration

A TypeScript application for interacting with Hyperliquid's DeFi protocol through Fordefi.

## Overview

This application enables secure interactions with the Hyperliquid protocol using Fordefi's enterprise-grade wallet infrastructure. It provides functionality for:

- Withdrawing funds from Hyperliquid to specified Ethereum addresses
- Sending USDC within the Hyperliquid ecosystem

## Prerequisites

- Fordefi organization and EVM vault
- Node.js and npm installed
- Fordefi credentials: API User token and API Signer set up ([documentation](https://docs.fordefi.com/developers/program-overview))
- TypeScript setup:
  ```bash
  # Install TypeScript and type definitions
  npm install typescript --save-dev
  npm install @types/node --save-dev
  npm install tsx --save-dev
  
  # Initialize a TypeScript configuration file (if not already done)
  npx tsc --init
  `

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables:

```bash
cp .env.example .env
```

4. Edit the `.env` file and add your `FORDEFI_API_USER_TOKEN`

5. Place your API User's private key in `./fordefi_secret/private.pem`

## Configuration

The application is configured through the `config.ts` file:

### Fordefi Configuration

```typescript
export const fordefiConfig: FordefiProviderConfig = {
    chainId: EvmChainId.NUMBER_42161, // Arbitrum
    address: '0x8BFCF9e2764BC84DE4BBd0a0f5AAF19F47027A73', // Your Fordefi EVM Vault
    apiUserToken: process.env.FORDEFI_API_USER_TOKEN,
    apiPayloadSignKey: fs.readFileSync('./fordefi_secret/private.pem', 'utf8'),
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    skipPrediction: false 
};
```

### Hyperliquid Configuration

```typescript
export const hyperliquidConfig: HyperliquidConfig = {
    destination: "0x5b7a034488F0BDE8bAD66f49cf9587ad40B6c757", // Destination address
    amount: "6" // Amount to withdraw/send
};
```

## Usage

First, ensure that your Fordefi API Signer is running

### Withdraw funds from Hyperliquid

To withdraw funds from Hyperliquid to the specified destination address:

```bash
npm run hl
```

The default behavior is to execute the `withdraw3` function with the configuration specified in `src/config.ts`.

### Send USDC within Hyperliquid

To send USDC to another address within Hyperliquid, modify the `main()` function in `src/run.ts`:

```typescript
async function main(){
    try {
        // Replace withdraw3 with usdSend
        await usdSend(hyperliquidConfig)
    } catch (error) {
        console.error("Oops, an error occured: ", error)
    }
}
```

Then run:

```bash
npm run hl
```

## Core Components

- **config.ts**: Main configuration for both Fordefi and Hyperliquid
- **hl-withdraw.ts**: Handles withdrawals from Hyperliquid
- **hl-send-usdc.ts**: Manages USDC transfers within Hyperliquid
- **get-provider.ts**: Creates a Fordefi Web3 Provider instance

## Key Features

1. **Secure Signing**: Uses Fordefi's enterprise-grade signing infrastructure
2. **Chainid Handling**: Correctly manages Arbitrum chainId in EIP-712 signing
3. **Error Handling**: Provides readable error messages for common failure cases
4. **Provider Management**: Singleton pattern for efficient provider handling

## Troubleshooting

### Common Issues

1. **"FORDEFI_API_USER_TOKEN is not set"**
   - Ensure your `.env` file contains a valid Fordefi API user token

2. **"PEM_PRIVATE_KEY is not set"**
   - Make sure your private key file exists at `./fordefi_secret/private.pem`

3. **"Insufficient balance"**
   - Your account doesn't have enough funds for the requested withdrawal amount