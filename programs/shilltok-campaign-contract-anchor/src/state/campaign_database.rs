use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
#[derive(InitSpace)]
pub struct ServiceFee {
    pub lamport_fee: u32,
    pub token_fee_percentage: u32,
}
#[account]
#[derive(InitSpace)]
pub struct CampaignDatabase {
    pub id: u64, // 8 bytes
    pub counter: u64, // 8 bytesx
    // TODO: Add a pause to pause the project if needed
    #[max_len(100)]
    pub service_fee: Vec<ServiceFee>,
}
