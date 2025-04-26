use anchor_lang::prelude::*;

pub const ANCHOR_DESCRIMINATOR_SIZE: usize = 8;

// Invalid pubkey
pub const ORIGINATOR_ADMIN_PUBKEY: Pubkey = pubkey!("9WA5RWh7M8aHa6Z23deehGTiQtSw2oTQaKu5j4Vhhz1y");

pub const CAMPAIGN_NAME_MIN_SIZE: usize = 5;
pub const CAMPAIGN_NAME_MAX_SIZE: usize = 50;

pub const MAX_NUMBER_OF_X_HANDLE_PER_CAMPAIGN: usize = 20;
pub const MIN_HANDLE_SIZE: usize = 2;
pub const MAX_HANDLE_SIZE: usize = 300;
pub const MIN_NUMBER_OF_CAMPAIGN_TOKEN: usize = 100;
pub const MAX_PUBKEY_IN_ALLOWLIST: usize = 100;
pub const MIN_TOKEN_NAME_AND_SYMBOL_SIZE: usize = 3;
pub const MAX_TOKEN_NAME_SIZE: usize = 50;
pub const MAX_TOKEN_SYMBOL_SIZE: usize = 10;

pub const MAX_NUMBER_OF_KEYWORDS: usize = 3;
pub const MIN_SIZE_OF_KEYWORD_STRING: usize = 2;
pub const MAX_SIZE_OF_KEYWORD_STRING: usize = 50;

pub const MIN_TIME_BEFORE_STARTING_CAMPAIGN_SEC: usize = 600; // 10 minutes
pub const MIN_CAMPAIGN_DURATION_SEC: usize = 3600; // 1hour