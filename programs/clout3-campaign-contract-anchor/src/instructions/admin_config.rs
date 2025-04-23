use crate::{constants::ORIGINATOR_ADMIN_PUBKEY, constants::ANCHOR_DESCRIMINATOR_SIZE , state::AdminConfig};
use anchor_lang::prelude::*;
use crate::errors::AdminError;

#[derive(Accounts)]
#[instruction(id_config: u64)]
pub struct CreateAdminConfig<'info> {
    #[account(mut, address = ORIGINATOR_ADMIN_PUBKEY)]
    admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = ANCHOR_DESCRIMINATOR_SIZE + AdminConfig::INIT_SPACE,
        seeds = [b"admin-cf", &id_config.to_le_bytes()], 
        bump,
    )]
    admin_config: Account<'info, AdminConfig>,
    system_program: Program<'info, System>,
}

pub fn create_admin_config(
    ctx: Context<CreateAdminConfig>,
    id_config: u64,
    project_wallet: Pubkey,
) -> Result<()> {
    *ctx.accounts.admin_config = AdminConfig {
        admin: ctx.accounts.admin.key(),
        project_wallet,
        new_admin: None,
        id_config,
    };
    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_config: u64)]
pub struct SetNewAdmin<'info> {
    admin: Signer<'info>,
    #[account(
        mut,
        has_one = admin,
        seeds = [b"admin-cf", &_id_config.to_le_bytes()],
        bump,
    )]
    admin_config: Account<'info, AdminConfig>,
    system_program: Program<'info, System>,
}

pub fn set_new_admin(
    ctx: Context<SetNewAdmin>,
    _id_config: u64,
    admin: Pubkey,
) -> Result<()> {
    ctx.accounts.admin_config.new_admin = Some(admin);
    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_config: u64)]
pub struct UpdateAdmin<'info> {
    signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"admin-cf", &_id_config.to_le_bytes()],
        bump
    )]
    admin_config: Account<'info, AdminConfig>,
    system_program: Program<'info, System>,
}

pub fn update_admin(
    ctx: Context<UpdateAdmin>,
    _id_config: u64,
) -> Result<()> {
    match ctx.accounts.admin_config.new_admin {
        None => return err!(AdminError::NoNewAdmin),
        Some(new_admin) => if ctx.accounts.signer.key() == new_admin {
            ctx.accounts.admin_config.admin = new_admin;
            ctx.accounts.admin_config.new_admin = None;
        } else {
            return err!(AdminError::UnauthorizedUser)
        },
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_config: u64)]
pub struct UpdateProjectWallet<'info> {
    admin: Signer<'info>,
    #[account(
        has_one = admin,
        mut,
        seeds = [b"admin-cf", &_id_config.to_le_bytes()],
        bump
    )]
    admin_config: Account<'info, AdminConfig>,
    system_program: Program<'info, System>,
}

pub fn update_project_wallet(
    ctx: Context<UpdateProjectWallet>,
    _id_config: u64,
    project_wallet: Pubkey,
) -> Result<()> {
    ctx.accounts.admin_config.project_wallet = project_wallet;
    Ok(())
}