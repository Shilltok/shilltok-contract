use crate::{constants::ANCHOR_DESCRIMINATOR_SIZE, state::CampaignDatabase, state::ServiceFee, state::AdminConfig};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(_id_config: u64, id_db: u64)]
pub struct CreateCampaignDatabase<'info> {
    #[account(
        has_one = admin,
        seeds = [b"admin-cf", &_id_config.to_le_bytes()],
        bump
    )]
    admin_config: Account<'info, AdminConfig>,
    #[account(mut)]
    admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = ANCHOR_DESCRIMINATOR_SIZE + CampaignDatabase::INIT_SPACE,
        seeds = [b"campg-db", &id_db.to_le_bytes()], 
        bump,
    )]
    campaign_database: Account<'info, CampaignDatabase>,
    system_program: Program<'info, System>,
}

pub fn create_campaign_database(
    ctx: Context<CreateCampaignDatabase>,
    _id_config: u64,
    id_db: u64,
    service_fee: Vec<ServiceFee>,
) -> Result<()> {
    *ctx.accounts.campaign_database = CampaignDatabase {
        id: id_db,
        counter: 0,
        service_fee,
    };
    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_config: u64, _id_db: u64)]
pub struct UpdateServiceFee<'info> {
    #[account(
        has_one = admin,
        seeds = [b"admin-cf", &_id_config.to_le_bytes()],
        bump
    )]
    admin_config: Account<'info, AdminConfig>,
    admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"campg-db", &_id_db.to_le_bytes()], 
        bump,
    )]
    campaign_database_account: Account<'info, CampaignDatabase>,
    system_program: Program<'info, System>,
}

pub fn update_service_fee(
    ctx: Context<UpdateServiceFee>,
    _id_config: u64,
    _id_db: u64,
    service_fee: Vec<ServiceFee>,
) -> Result<()> {
    ctx.accounts.campaign_database_account.service_fee = service_fee;
    Ok(())
}