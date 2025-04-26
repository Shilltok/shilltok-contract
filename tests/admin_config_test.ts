import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import BN from "bn.js";
import { Keypair } from '@solana/web3.js';
import { CloutCampaignProgram } from '../target/types/clout_campaign_program'
import { expect } from 'chai'
import { assert } from 'chai'

/**********************************************************************************/
/* create-admin-cf */
/**********************************************************************************/
describe('create_admin_config', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new Keypair();
    const provider = anchor.AnchorProvider.local()
    anchor.setProvider(provider)
    const payer = provider.wallet as anchor.Wallet;
    const program = anchor.workspace.CloutCampaignProgram as Program<CloutCampaignProgram>

    it('create_admin_config_success', async () => {
        const idConfig = new BN(123456789);

        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        const adminConfigInfo = {
            id: idConfig,
            projectWallet: projectWallet.publicKey
        };

        //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
        //console.log("Program: ", await program.methods.createAdminConfig(adminConfigInfo.id, adminConfigInfo.projectWallet));
        await program.methods
            .createAdminConfig(adminConfigInfo.id, adminConfigInfo.projectWallet)
            .accounts({
                adminConfig,
            })
            .rpc()

        const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig)
        expect(adminConfigAccount.idConfig.toNumber()).to.equal(123456789)
        expect(adminConfigAccount.admin.toBase58()).to.equal(payer.publicKey.toBase58())
        expect(adminConfigAccount.projectWallet.toBase58()).to.equal(projectWallet.publicKey.toBase58())
        expect(adminConfigAccount.newAdmin).to.equal(null)

        //console.log('adminConfig address', adminConfig.toBase58())
    })

    it('create_admin_config_fail_not_admin', async () => {
        const idConfig = new BN(123456799);
    
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        const adminConfigInfo = {
            id: idConfig,
            projectWallet: projectWallet.publicKey
        };

        //anchor automatically fills the user of Account type Signer with the provider and the SystemProgram
        try {
            await program.methods
            .createAdminConfig(adminConfigInfo.id, adminConfigInfo.projectWallet)
            .accounts({
                adminConfig,
            })
            .signers([projectWallet])
            .rpc()
            assert.fail("This operation shall fail")
          } catch (error) {
            const errorMessage = (error as Error).message;
            //console.log('Error message:', errorMessage);
            assert.isTrue(errorMessage.includes('unknown signer'));
          }
        //console.log('adminConfig address', adminConfig.toBase58())
    })
})

/**********************************************************************************/
/* Helpers */
/**********************************************************************************/
async function create_admin_config(adminConfig, idConfig, payer, program, projectWallet) {
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
  }

/**********************************************************************************/
/* set_new_admin */
/**********************************************************************************/
describe('set_new_admin', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new Keypair();
    const alice = new Keypair();
    const provider = anchor.AnchorProvider.local()
    anchor.setProvider(provider)
    const payer = provider.wallet as anchor.Wallet;
    const program = anchor.workspace.CloutCampaignProgram as Program<CloutCampaignProgram>
    
    it('set_new_admin_success', async () => {
        const idConfig = new BN(123456791);

        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        await create_admin_config(adminConfig, idConfig, payer, program, projectWallet);

        await program.methods
        .setNewAdmin(idConfig, alice.publicKey)
        .accounts({
            adminConfig,
        })
        .rpc()       

        const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
        expect(adminConfigAccount.newAdmin.toBase58()).to.equal(alice.publicKey.toBase58())
    })

    it('set_new_admin_fail_not_admin', async () => {
        const idConfig = new BN(123456792);
        // Create admin-cf account
        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        await create_admin_config(adminConfig, idConfig, payer, program, projectWallet);

        try {
            await program.methods
            .setNewAdmin(idConfig, alice.publicKey)
            .accounts({
                adminConfig,
            })
            .signers([alice])
            .rpc()
            assert.fail("This operation shall fail")
          } catch (error) {
            const errorMessage = (error as Error).message;
            //console.log('Error message:', errorMessage);
            assert.isTrue(errorMessage.includes('unknown signer'));
          }
    })
})

/**********************************************************************************/
/* update_admin */
/**********************************************************************************/
describe('update_admin', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new Keypair();
    const alice = new Keypair();
    const bob = new Keypair();
    const provider = anchor.AnchorProvider.local()
    anchor.setProvider(provider)
    const payer = provider.wallet as anchor.Wallet;
    const program = anchor.workspace.CloutCampaignProgram as Program<CloutCampaignProgram>
    
    it('update_admin_fail_no_call_to_set_new_admin', async () => {
        const idConfig = new BN(123456793);

        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        await create_admin_config(adminConfig, idConfig, payer, program, projectWallet);

        try {
            await program.methods
            .updateAdmin(idConfig)
            .accounts({
                adminConfig,
            })
            //.signers([alice])
            .rpc() 
            assert.fail("This operation shall fail")
          } catch (error) {
            const errorMessage = (error as Error).message;
            assert.isTrue(errorMessage.includes('No new admin'));
          }    

        //const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
        //expect(adminConfigAccount.newAdmin.toBase58()).to.equal(alice.publicKey.toBase58())
    })

    it('update_admin_fail_new_admin_address_not_used', async () => {
        const idConfig = new BN(123456794);

        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        await create_admin_config(adminConfig, idConfig, payer, program, projectWallet);

        await program.methods
        .setNewAdmin(idConfig, alice.publicKey)
        .accounts({
            adminConfig,
        })
        .rpc() 

        try {
            await program.methods
            .updateAdmin(idConfig)
            .accounts({
                adminConfig,
            })
            //.signers([alice])
            .rpc() 
            assert.fail("This operation shall fail")
          } catch (error) {
            const errorMessage = (error as Error).message;
            assert.isTrue(errorMessage.includes('Unauthorized user'));
          }    

        //const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
        //expect(adminConfigAccount.newAdmin.toBase58()).to.equal(alice.publicKey.toBase58())
    })

    it('update_admin_success', async () => {
        const idConfig = new BN(123456795);

        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        await create_admin_config(adminConfig, idConfig, payer, program, projectWallet);

        await program.methods
        .setNewAdmin(idConfig, alice.publicKey)
        .accounts({
            adminConfig,
        })
        .rpc() 

        await program.methods
        .updateAdmin(idConfig)
        .accounts({
            signer: alice.publicKey,
            adminConfig,
        })
        .signers([alice])
        .rpc()

        const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
        expect(adminConfigAccount.admin.toBase58()).to.equal(alice.publicKey.toBase58())
        expect(adminConfigAccount.newAdmin).to.equal(null)

        try {
            await program.methods
                .setNewAdmin(idConfig, bob.publicKey)
                .accounts({
                    adminConfig,
                })
                .signers([projectWallet])
                .rpc()
                assert.fail("This operation shall fail")
        } catch (error) {
            const errorMessage = (error as Error).message;
            assert.isTrue(errorMessage.includes('unknown signer'));
          }

        const adminConfigAccount2 = await program.account.adminConfig.fetch(adminConfig);

        await program.methods
        .setNewAdmin(idConfig, bob.publicKey)
        .accounts({
            admin: alice.publicKey,  // ✅ Explicitly pass Alice's public key
            adminConfig,
        })
        .signers([alice])
        .rpc()
    })
})

/**********************************************************************************/
/* update_project_wallet */
/**********************************************************************************/
describe('update_project_wallet', () => {
    // Configure the client to use the local cluster.
    const projectWallet = new Keypair();
    const newProjectWallet = new Keypair();
    const alice = new Keypair();
    const provider = anchor.AnchorProvider.local()
    anchor.setProvider(provider)
    const payer = provider.wallet as anchor.Wallet;
    const program = anchor.workspace.CloutCampaignProgram as Program<CloutCampaignProgram>
    
    it('update_project_wallet_fail_not_admin', async () => {
        const idConfig = new BN(123);

        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        await create_admin_config(adminConfig, idConfig, payer, program, projectWallet);

        try {
            await program.methods
            .updateProjectWallet(idConfig, newProjectWallet.publicKey)
            .accounts({
                adminConfig,
            })
            .signers([alice])
            .rpc() 
            assert.fail("This operation shall fail")
          } catch (error) {
            const errorMessage = (error as Error).message;
            assert.isTrue(errorMessage.includes('unknown signer'));
          }    
    })

    it('update_project_wallet_success', async () => {
        const idConfig = new BN(124);

        const [adminConfig, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('admin-cf'), idConfig.toArrayLike(Buffer, "le", 8)],
            program.programId,
        )

        await create_admin_config(adminConfig, idConfig, payer, program, projectWallet);

        await program.methods
        .updateProjectWallet(idConfig, newProjectWallet.publicKey)
        .accounts({
            adminConfig,
        })
        .rpc() 

        const adminConfigAccount = await program.account.adminConfig.fetch(adminConfig);
        expect(adminConfigAccount.projectWallet.toBase58()).to.equal(newProjectWallet.publicKey.toBase58())
    })
})