use anchor_lang::prelude::*;
use crate::constants::{CAMPAIGN_NAME_MAX_SIZE, MAX_NUMBER_OF_X_HANDLE_PER_CAMPAIGN, MAX_HANDLE_SIZE, MAX_PUBKEY_IN_ALLOWLIST, MAX_NUMBER_OF_KEYWORDS, MAX_SIZE_OF_KEYWORD_STRING};

use super::ServiceFee;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
#[derive(InitSpace)]
pub struct Handle {
    #[max_len(MAX_HANDLE_SIZE)]
    pub handle_name: String,
    pub handle_pubkey: Pubkey,
    pub percent_reward: u8,
    pub claimed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
#[derive(InitSpace)]
pub struct AllowList {
    #[max_len(MAX_PUBKEY_IN_ALLOWLIST)]
    pub allow_list: Vec<Pubkey>,
    pub allow_list_in_used: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
#[derive(InitSpace)]
pub enum CampaignState {
    Initialized,
    HandlesReady,
    AssetsReady,
    Open,
    Closed
}

#[account]
#[derive(InitSpace)]
pub struct CampaignInfo {
    pub user: Pubkey,
    #[max_len(CAMPAIGN_NAME_MAX_SIZE)]
    pub name: String,
    #[max_len(MAX_NUMBER_OF_KEYWORDS, MAX_SIZE_OF_KEYWORD_STRING)]
    pub keywords: Vec<String>,
    pub begin_unix_timestamp: i64,
    pub end_unix_timestamp: i64,
    pub state: CampaignState,   
}

#[account]
#[derive(InitSpace)]
pub struct CampaignAssets {
    pub mint_account_key: Pubkey,
    pub token_amount_in_decimals: u64,
    pub remaining_token: u64,
    pub copied_service_fee: ServiceFee,
}

#[account]
#[derive(InitSpace)]
pub struct CampaignHandles {
    #[max_len(MAX_NUMBER_OF_X_HANDLE_PER_CAMPAIGN)]
    pub handles: Vec<Handle>,
}

#[account]
#[derive(InitSpace)]
pub struct CampaignAllowlist {
    pub allow_list: AllowList,
}
