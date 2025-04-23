use anchor_lang::prelude::*;

#[error_code]
pub enum CampaignError {
    #[msg("Campaign: Name must be at least 5 chars but not more than 100 chars")]
    InvalidCampaignNameSize,
    #[msg("Campaign: End date must be greater than start data")]
    InvalidCampaignEndDate,
    #[msg("Campaign: Start date is invalid")]
    InvalidCampaignStartDate,
    #[msg("Campaign: Invalid X handle")]
    InvalidXHandle, 
    #[msg("Campaign: Too many X handles registered")]   
    TooManyHandles,
    #[msg("Campaign: Invalid database ID")] 
    InvalidDabaseId,
    #[msg("Campaign: Invalid campaign ID")] 
    InvalidCampaignId,
    #[msg("Campaign: Invalid campaign counter")]
    InvalidCampaignCounter,
    #[msg("Campaign: Invalid project wallet")]
    InvalidProjectWallet,
    #[msg("Campaign: Invalid service fee index")]
    InvalidServiceFeeIndex,
    #[msg("Campaign: Invalid service fee")]
    InvalidServiceFee,
    #[msg("Campaign: Not open")]
    NotOpen,
    #[msg("Campaign: Handles number limit reached")]
    HandleNumberLimitReached,
    #[msg("Campaign: Invalid handles")]
    InvalidHandles,
    #[msg("Campaign: Invalid percentages for rewards")]
    InvalidPercentagesForRewards,
    #[msg("Campaign: Not enough tokens")]
    NotEnoughToken,
    #[msg("Campaign: Invalid mint account")]
    InvalidMintAccount,
    #[msg("Campaign: Already registered")]
    AlreadyRegistered,
    #[msg("Campaign: Not registered")]
    NotRegistered,
    #[msg("Campaign: Is opened")]
    CampaignIsOpened,
    #[msg("Campaign: Time not elapsed")]
    TimeNotElapsed,
    #[msg("Campaign: Already claimed")]
    AlreadyClaimed,
    #[msg("Campaign: No reward")]
    NoReward,
    #[msg("Campaign: Invalid state")]
    CampaignInvalidState,
    #[msg("Campaign: Invalid number of keywords")]
    InvalidNumberOfKeywords,
    #[msg("Campaign: Invalid keyword size")]
    InvalidKeywordSize,
}

#[error_code]
pub enum AdminError {
    #[msg("Admin: Unauthorized user")]
    UnauthorizedUser,
    #[msg("Admin: No new admin")]
    NoNewAdmin,  
}