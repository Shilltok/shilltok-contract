import * as anchor from '@coral-xyz/anchor'
import {
    Program,
    BN,
    web3,
  } from "@coral-xyz/anchor";
import {
    PublicKey,
    SystemProgram,
    Keypair,
  } from "@solana/web3.js"; // Import SendTransactionError
import { Clout3CampaignProgram } from '../target/types/clout3_campaign_program'
import { TransferTokens } from '../target/types/transfer_tokens'
import { expect } from 'chai'
import * as splToken from "@solana/spl-token";
import {
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

/**********************************************************************************/
/* Helpers */
/**********************************************************************************/
async function create_admin_config(idConfig, payer, program, projectWallet) {
    const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
        program.programId,
    )

    await program.methods
        .createAdminConfig(idConfig, projectWallet.publicKey)
        .accounts({
            adminConfig,
        })
        .rpc()

    const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
    expect(adminConfigAccount.idConfig.toNumber()).to.equal(idConfig.toNumber())
    expect(adminConfigAccount.admin.toBase58()).to.equal(payer.publicKey.toBase58())
    expect(adminConfigAccount.projectWallet.toBase58()).to.equal(projectWallet.publicKey.toBase58())
    expect(adminConfigAccount.newAdmin).to.equal(null)

    return adminConfig;
  }

  type ServiceFee = {
    lamportFee: number;
    tokenFeePercentage: number;
  };

async function create_campaign_database(payer, idConfig, idDb, program, adminConfig){
    const [campaignDatabase] = PublicKey.findProgramAddressSync(
        [Buffer.from('campg-db'), idDb.toArrayLike(Buffer, "le", 8)],
        program.programId,
    )
    const serviceFees = [{lamportFee:0, tokenFeePercentage: 10}];
    //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
    await program.methods
        .createCampaignDatabase(idConfig, idDb, serviceFees)
        .accounts({
            adminConfig,
        })
        .rpc()
    return campaignDatabase;
}

async function create_project_wallet(provider, payer, projectWallet) {
    const tx = new web3.Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: projectWallet.publicKey,
          space: 0,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(0),
          programId: SystemProgram.programId,
        })
      );
      await provider.sendAndConfirm(tx, [projectWallet]);
}

describe('create_campaign', () => {
    // Configure the client to use the local cluster.
    const keypair = new Keypair();
    const projectWallet = new Keypair();
    const provider = anchor.AnchorProvider.local()
    anchor.setProvider(provider)
    const payer = provider.wallet as anchor.Wallet;
    const program = anchor.workspace.Clout3CampaignProgram as Program<Clout3CampaignProgram>
    const programHelperToken = anchor.workspace.TransferTokens as Program<TransferTokens>

    const idDb = new BN(123456792);
    const idConfig = new BN(987665243);

    create_project_wallet(provider, payer, projectWallet);

    const metadata = {
        name: 'Solana Gold',
        symbol: 'GOLDSOL',
        uri: 'https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json',
      };
    
      // Generate new keypair to use as address for mint account.
      const mintKeypair = new Keypair();
    
      // Generate new keypair to use as address for recipient wallet.
      const recipient = new Keypair();
    
      // Derive the associated token address account for the mint and payer.
      const senderTokenAddress = getAssociatedTokenAddressSync(mintKeypair.publicKey, payer.publicKey);
    
      it('Create an SPL Token!', async () => {
        const transactionSignature = await programHelperToken.methods
          .createToken(metadata.name, metadata.symbol, metadata.uri)
          .accounts({
            payer: payer.publicKey,
            mintAccount: mintKeypair.publicKey,
          })
          .signers([mintKeypair])
          .rpc();
    
        console.log('Success!');
        console.log(`   Mint Address: ${mintKeypair.publicKey}`);
        console.log(`   Transaction Signature: ${transactionSignature}`);
      });
    
      it('Mint tokens!', async () => {
        // Amount of tokens to mint.
        const amount = new anchor.BN(200);
    
        // Mint the tokens to the associated token account.
        const transactionSignature = await programHelperToken.methods
          .mintToken(amount)
          .accounts({
            mintAuthority: payer.publicKey,
            recipient: payer.publicKey,
            mintAccount: mintKeypair.publicKey,
            associatedTokenAccount: senderTokenAddress,
          })
          .rpc();
    
        console.log('Success!');
        console.log(`   Associated Token Account Address: ${senderTokenAddress}`);
        console.log(`   Transaction Signature: ${transactionSignature}`);
      });        

    it('create_campaign_success', async () => {
        const adminConfig = await create_admin_config(idConfig, payer, program, keypair);
        const campaignDatabase = await create_campaign_database(payer, idConfig, idDb, program, adminConfig);
        const campaignDatabaseAccount = await program.account.campaignDatabase.fetch(campaignDatabase);

        if (!campaignDatabaseAccount) {
            throw new Error("Campaign Database Account does not exist!");
          }

        const [campaignInfo] = PublicKey.findProgramAddressSync(
            [Buffer.from("cpn_info"), campaignDatabaseAccount.id.toArrayLike(Buffer, "le", 8), campaignDatabaseAccount.counter.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        const params = {
        idDb: new BN(campaignDatabaseAccount.id),
        campaignCounter: new BN(campaignDatabaseAccount.counter),
        name: "testUno",
        keywords: ["test1", "test2", "test3"],
        beginTimestamp: new BN(Math.floor(Date.now() / 1000) + 3600),
        endTimestamp: new BN(Math.floor(Date.now() / 1000) + 86400),
        tokenAmount: new BN(120),
        serviceFeeIndex: new BN(0),
        tokenName: "MyToken",
        tokenSymbol: "MTO",
        };   

        let campaignInitAccounts = {
            user: payer.publicKey,
            campaignAccount: campaignInfo,
            campaignDatabaseAccount: campaignDatabase,
            systemProgram: SystemProgram.programId,
        }
                
        await program.methods
        .initCampaign(
            params.idDb,
            params.campaignCounter,
            params.name,
            params.keywords,
            params.beginTimestamp,
            params.endTimestamp,
        )
        .accounts(campaignInitAccounts)
        .signers([payer.payer]) 
        .rpc(); // <--- Get transaction instead of `.rpc()`

        // Initialize handle
        const [campaignHandles] = PublicKey.findProgramAddressSync(
            [Buffer.from("cpn_hndl"), campaignDatabaseAccount.id.toArrayLike(Buffer, "le", 8), campaignDatabaseAccount.counter.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        let campaignInitHandlesAccount = {
            user: payer.publicKey,
            campaign_handles_account: campaignHandles,
            campaignAccount: campaignInfo,
            systemProgram: SystemProgram.programId,
        }

        await program.methods
        .initCampaignHandles(
          params.idDb,
          params.campaignCounter,
        )
        .accounts(campaignInitHandlesAccount)
        .signers([payer.payer]) 
        .rpc(); 


        // Initialize assets
        const [campaignAssets] = PublicKey.findProgramAddressSync(
            [Buffer.from("cpn_asst"), campaignDatabaseAccount.id.toArrayLike(Buffer, "le", 8), campaignDatabaseAccount.counter.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        let campaignInitAssetsAccount = {
            user: payer.publicKey,
            campaign_assets_account: campaignAssets,
            campaignAccount: campaignInfo,
            systemProgram: SystemProgram.programId,
        }

        await program.methods
        .initCampaignAssets(
          params.idDb,
          params.campaignCounter,
        )
        .accounts(campaignInitAssetsAccount)
        .signers([payer.payer]) 
        .rpc(); 

        // Open campaign

        const recipientTokenAddress = getAssociatedTokenAddressSync(mintKeypair.publicKey, campaignAssets, true);
        const recipientFeeAccount = getAssociatedTokenAddressSync(mintKeypair.publicKey, projectWallet.publicKey);

        let openCampaignAccounts = {
            user: payer.publicKey,
            campaignAssetsAccount: campaignAssets,
            campaignAccount: campaignInfo,
            campaignDatabaseAccount: campaignDatabase,
            projectWallet: projectWallet.publicKey,
            mintAccount: mintKeypair.publicKey,
            senderTokenAccount: senderTokenAddress,
            recipientTokenAccount: recipientTokenAddress,
            recipientFeeAccount: recipientFeeAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          };

        await program.methods
        .openCampaign(
            params.idDb,
            params.campaignCounter,
            params.tokenAmount,
            params.serviceFeeIndex,
            params.tokenName,
            params.tokenSymbol,
        )
        .accounts(openCampaignAccounts)
        .signers([payer.payer]) 
        .rpc(); // <--- Get transaction instead of `.rpc()`

        console.log("Campaign database address:", campaignDatabase);
        console.log("Campaign database:", await program.account.campaignDatabase.fetch(campaignDatabase));

        console.log("Campaign info:", campaignInfo);
        console.log("Campaign info:", await program.account.campaignInfo.fetch(campaignInfo));

        console.log("Campaign handles address:", campaignHandles);
        console.log("Campaign handles:", await program.account.campaignHandles.fetch(campaignHandles));

        console.log("Campaign assets address:", campaignAssets);
        console.log("Campaign assets:", await program.account.campaignAssets.fetch(campaignAssets));

          const allowList: PublicKey[] = [
            // Add more public keys as needed
          ];

    })
})
