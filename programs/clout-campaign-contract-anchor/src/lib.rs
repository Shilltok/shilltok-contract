use anchor_lang::prelude::*;
use instructions::*;
use crate::state::ServiceFee;

pub mod constants;
pub mod instructions;
pub mod state;
pub mod errors;

declare_id!("EpgXpXKz4QHfGxr5QnpELaXu9quNahhfJzYikLDPGxkz");

#[program]
pub mod clout_campaign_program {
    use super::*;

    // Admin config instructions
    pub fn create_admin_config(
        ctx: Context<CreateAdminConfig>,
        id_config: u64,
        project_wallet: Pubkey,
    ) -> Result<()> {
        admin_config::create_admin_config(ctx, id_config, project_wallet)
    }

    pub fn set_new_admin(
        ctx: Context<SetNewAdmin>,
        id_config: u64,
        new_admin: Pubkey,
    ) -> Result<()> {
        admin_config::set_new_admin(ctx, id_config, new_admin)
    }

    pub fn update_admin(
        ctx: Context<UpdateAdmin>,
        id_config: u64,
    ) -> Result<()> {
        admin_config::update_admin(ctx, id_config)
    }

    pub fn update_project_wallet(
        ctx: Context<UpdateProjectWallet>,
        id_config: u64,
        project_wallet: Pubkey,
    ) -> Result<()> {
        admin_config::update_project_wallet(ctx, id_config, project_wallet)
    }

    // Campaign database instructions
    pub fn create_campaign_database(
        ctx: Context<CreateCampaignDatabase>,
        id_config: u64,
        id_db: u64,
        service_fee: Vec<ServiceFee>,
    ) -> Result<()> {
        campaign_database::create_campaign_database(ctx, id_config, id_db, service_fee)
    }

    pub fn update_service_fee(
        ctx: Context<UpdateServiceFee>,
        id_config: u64,
        id_db: u64,
        service_fee: Vec<ServiceFee>,
    ) -> Result<()> {
        campaign_database::update_service_fee(ctx, id_config, id_db, service_fee)
    }

    // Campaign instructions
    pub fn init_campaign(
        ctx: Context<InitCampaign>,
        id_db: u64,
        campaign_counter: u64,
        name: String,
        keywords: Vec<String>,
        begin_timestamp: i64,
        end_timestamp: i64,
    ) -> Result<()> {
        campaign::init_campaign(ctx, id_db, campaign_counter, name, keywords, begin_timestamp, end_timestamp)
    }

    pub fn init_campaign_handles(
        ctx: Context<InitCampaignHandles>,
        id_db: u64,
        campaign_counter: u64,
    ) -> Result<()> {
        campaign::init_campaign_handles(ctx, id_db, campaign_counter)
    }

    pub fn init_campaign_assets(
        ctx: Context<InitCampaignAssets>,
        id_db: u64,
        campaign_counter: u64,
    ) -> Result<()> {
        campaign::init_campaign_assets(ctx, id_db, campaign_counter)
    }

    pub fn open_campaign(
        ctx: Context<OpenCampaign>,
        id_db: u64,
        campaign_counter: u64,
        token_amount_in_decimals: u64,
        service_fee_index: u64,
        token_name: String,
        token_symbol: String,
    ) -> Result<()> {
        campaign::open_campaign(ctx, id_db, campaign_counter, token_amount_in_decimals, service_fee_index as usize, token_name, token_symbol)
    }

    pub fn register_handle(
        ctx: Context<RegisterHandle>,
        id_db: u64,
        campaign_counter: u64,
        handle_name: String,
    ) -> Result<()> {
        campaign::register_handle(ctx, id_db, campaign_counter, handle_name)
    }

    pub fn admin_send_reward_percentages(
        ctx: Context<RegisterHandle>,
        id_config: u64,
        id_db: u64,
        campaign_counter: u64,
        rewards: Vec<(String, u8)>,
    ) -> Result<()> {
        campaign::admin_send_reward_percentages(ctx, id_config, id_db, campaign_counter, rewards)
    }

    pub fn claim(
        ctx: Context<Claim>,
        id_db: u64,
        campaign_counter: u64,
    ) -> Result<()> {
        campaign::claim(ctx, id_db, campaign_counter)
    }
}
