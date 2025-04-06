import { HyperliquidConfig, fordefiConfig } from './config'
import { getProvider } from './get-provider';
import * as hl from "@nktkas/hyperliquid";

export async function withdraw3(hlConfig: HyperliquidConfig) {
    if (!hlConfig) {
        throw new Error("Config required!");
    }
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
            signTypedData: async (
                domain:any, 
                types:any, 
                value:any
            ) => 
                {
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
            destination: hlConfig.destination as `0x${string}`, // Withdraw funds to your Fordefi EVM vault
            amount: String(hlConfig.amount || '6'),
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
        };
    };
};