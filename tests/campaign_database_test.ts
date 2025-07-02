import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import BN from "bn.js";
import { Keypair } from '@solana/web3.js';
import { ShilltokCampaignProgram } from '../target/types/shilltok_campaign_program'
import { expect } from 'chai'
import { assert } from 'chai'

/**********************************************************************************/
/* Helpers */
/**********************************************************************************/
async function create_admin_config(idConfig, payer, program, backend, projectWallet) {
    const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
        program.programId,
    )

    await program.methods
        .createAdminConfig(idConfig, backend.publicKey, projectWallet.publicKey)
        .accounts({
            adminConfig,
        })
        .rpc()

    const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
    expect(adminConfigAccount.idConfig.toNumber()).to.equal(idConfig.toNumber())
    expect(adminConfigAccount.admin.toBase58()).to.equal(payer.publicKey.toBase58())
    expect(adminConfigAccount.backend.toBase58()).to.equal(backend.publicKey.toBase58())
    expect(adminConfigAccount.projectWallet.toBase58()).to.equal(projectWallet.publicKey.toBase58())
    expect(adminConfigAccount.newAdmin).to.equal(null)

    return adminConfig;
  }

  type ServiceFee = {
    lamportFee: number;
    tokenFeePercentage: number;
  };

/**********************************************************************************/
/* create_campaign_database */
/**********************************************************************************/
describe('create_campaign_database', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new Keypair();
    const backend = new Keypair();
    const provider = anchor.AnchorProvider.local()
    anchor.setProvider(provider)
    const payer = provider.wallet as anchor.Wallet;
    const program = anchor.workspace.ShilltokCampaignProgram as Program<ShilltokCampaignProgram>
    const idConfig = new BN(1234567891234);
    const id = new BN(23482736);

   it('create_seed_for_admin_config', async () => {
        const my_id = new BN(1596006);

        const [campaignDatabase, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('campg-db'), my_id.toArrayLike(Buffer, "le", 8)],
            new anchor.web3.PublicKey("M5du56w3AvJPiX148aBhRTmALn87TpqvnLrzcbgiL5X"),
        )

        console.log(`campaignDatabase seed: ${campaignDatabase}`);
    })

    it('create_campaign_database_success', async () => {
        const adminConfig = await create_admin_config(idConfig, payer, program, backend, projectWallet);

        const [campaignDatabase, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('campg-db'), id.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )
        const serviceFees = [{lamportFee:1000, tokenFeePercentage: 10}];
        //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
        await program.methods
            .createCampaignDatabase(idConfig, id, serviceFees)
            .accounts({
                adminConfig,
            })
            .rpc()

        const campaignDatabaseAccount = await program.account.campaignDatabase.fetch(campaignDatabase)
        expect(campaignDatabaseAccount.id.toNumber()).to.equal(id.toNumber())
        expect(campaignDatabaseAccount.counter.toNumber()).to.equal(0)

    })
})