import { FordefiWeb3Provider, EvmChainId, FordefiProviderConfig } from '@fordefi/web3-provider';
import { ethers } from 'ethers';
import * as hl from "@nktkas/hyperliquid";
import dotenv from 'dotenv';
import fs from 'fs'

dotenv.config();

// Configure the Fordefi provider
const fordefiConfig: FordefiProviderConfig = {
  chainId: EvmChainId.NUMBER_42161, // Arbitrum
  address: '0x8BFCF9e2764BC84DE4BBd0a0f5AAF19F47027A73', // The Fordefi EVM Vault that will sign the message
  apiUserToken: process.env.FORDEFI_API_USER_TOKEN ?? (() => { throw new Error('FORDEFI_API_USER_TOKEN is not set'); })(), 
  apiPayloadSignKey: fs.readFileSync('./fordefi_secret/private.pem', 'utf8') ?? (() => { throw new Error('PEM_PRIVATE_KEY is not set'); })(),
  rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
  skipPrediction: false 
};

// Define provider
let fordefiProvider: FordefiWeb3Provider | null = null;
let provider: ethers.providers.Web3Provider | null = null;

// Function to get/create the provider
async function getProvider() {
    if (!fordefiProvider) {
        fordefiProvider = new FordefiWeb3Provider(fordefiConfig);
        // Callback to act upon a `connect` event
        const onConnect = (result: any) => {
            console.log(`Connected to chain: ${result.chainId}`);
        };
        // Subscribe using a callback
        fordefiProvider.on('connect', onConnect);
        // Wait for connection
        await new Promise<void>(resolve => {
            const onFirstConnect = (result: any) => {
                resolve();
                try {
                    fordefiProvider?.removeListener('connect', onFirstConnect);
                } catch (e) {
                }
            };
            fordefiProvider!.on('connect', onFirstConnect);
        });
        
        provider = new ethers.providers.Web3Provider(fordefiProvider);
    }
    
    return provider;
}

async function main() {
    try {
        // Get the singleton provider
        const provider = await getProvider();
        if (!provider) {
            throw new Error("Failed to initialize provider");
        };

        // Instanciate transport
        const transport = new hl.HttpTransport();

        // This custom signer ensures we're using the correct chainId to construct the message we'll sign
        const customSigner = {
            getAddress: async () => fordefiConfig.address,
            signTypedData: async (domain:any, types:any, value:any) => {
                const modifiedDomain = {
                    ...domain,
                    chainId: fordefiConfig.chainId
                };
                const signer = await provider.getSigner();
                return signer._signTypedData(
                    modifiedDomain,
                    types,
                    value
                );
            }
        };

        // Create a Hyperliquid wallet client using the Fordefi provider
        const client = new hl.WalletClient({ 
            wallet: customSigner, 
            transport 
        });
        console.log("Wallet client created successfully");

        // Account clearinghouse state
        const result = await client.withdraw3({
            destination: fordefiConfig.address, // Withdraw funds to your Fordefi EVM vault
            amount: "6", // 6 USD
        });
        console.log("Withdrawal successful:", result);
        
    } catch (error: any) {

        const errorMessage = error.message || String(error);
        
        if (errorMessage.includes("Insufficient balance")) {
            console.error("ERROR: Not enough funds for withdrawal");
        } else if (errorMessage.includes("provider") || errorMessage.includes("connect")) {
            console.error("ERROR: Provider connection issue");
        } else {
            console.error("ERROR:", errorMessage);
        }
    }
}
main().catch(error => {
    console.error("Unhandled error:", error);
});