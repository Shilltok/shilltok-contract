use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AdminConfig {
    pub admin: Pubkey,
    pub backend: Pubkey,
    pub project_wallet: Pubkey,
    pub new_admin: Option<Pubkey>,
    pub id_config: u64,
}