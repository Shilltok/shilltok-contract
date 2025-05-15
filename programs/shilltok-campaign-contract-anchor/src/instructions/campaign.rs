use crate::{constants::{CAMPAIGN_NAME_MIN_SIZE, 
    CAMPAIGN_NAME_MAX_SIZE, 
    ANCHOR_DESCRIMINATOR_SIZE, 
    MAX_NUMBER_OF_X_HANDLE_PER_CAMPAIGN, 
    MIN_HANDLE_SIZE, 
    MAX_HANDLE_SIZE, 
    MIN_NUMBER_OF_CAMPAIGN_TOKEN,
    MAX_NUMBER_OF_KEYWORDS,
    MIN_SIZE_OF_KEYWORD_STRING,
    MAX_SIZE_OF_KEYWORD_STRING,
    MIN_TIME_BEFORE_STARTING_CAMPAIGN_SEC,
    MIN_CAMPAIGN_DURATION_SEC,
    MIN_TOKEN_NAME_AND_SYMBOL_SIZE,
    MAX_TOKEN_NAME_SIZE,
    MAX_TOKEN_SYMBOL_SIZE}, 
    state::CampaignDatabase, state::CampaignInfo, state::CampaignHandles, state::CampaignState, state::CampaignAssets, state::UserReward, state::Handle, state::AllowList, state::AdminConfig};
use crate::errors::CampaignError;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use anchor_lang::system_program;

#[derive(Accounts)]
#[instruction(id_db: u64, campaign_counter: u64)]
pub struct InitCampaign<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = ANCHOR_DESCRIMINATOR_SIZE + CampaignInfo::INIT_SPACE,
        seeds = [b"cpn_info", &id_db.to_le_bytes(), &campaign_counter.to_le_bytes()], 
        bump,
    )]
    campaign_info_account: Box<Account<'info, CampaignInfo>>,
    #[account(
        mut,
        seeds = [b"campg-db", &id_db.to_le_bytes()],
        bump,
    )]
    campaign_database_account: Box<Account<'info, CampaignDatabase>>,
 
    // System program
    system_program: Program<'info, System>,
}

pub fn init_campaign(
    ctx: Context<InitCampaign>,
    id_db: u64,
    campaign_counter: u64,
    name: String,
    keywords: Vec<String>,
    begin_timestamp: i64,
    end_timestamp: i64,
) -> Result<()> {
    require!(keywords.len() <= MAX_NUMBER_OF_KEYWORDS, CampaignError::InvalidNumberOfKeywords);
    require!((name.len() >= CAMPAIGN_NAME_MIN_SIZE) && (name.len() <= CAMPAIGN_NAME_MAX_SIZE), CampaignError::InvalidCampaignNameSize);
    require!((end_timestamp > begin_timestamp) && ((end_timestamp - begin_timestamp) >= MIN_CAMPAIGN_DURATION_SEC as i64), CampaignError::InvalidCampaignEndDate);
    let clock: Clock = Clock::get()?;
    require!(begin_timestamp >= (clock.unix_timestamp + MIN_TIME_BEFORE_STARTING_CAMPAIGN_SEC as i64) , CampaignError::InvalidCampaignStartDate);
    // TODO: Make an allowlist. Do it for the campaign as well ?

    require!((*ctx.accounts.campaign_database_account).id == id_db, CampaignError::InvalidDabaseId);
    require!((*ctx.accounts.campaign_database_account).counter == campaign_counter, CampaignError::InvalidCampaignCounter);

    (*ctx.accounts.campaign_info_account).user = ctx.accounts.user.key();
    (*ctx.accounts.campaign_info_account).name = name.clone();

    (*ctx.accounts.campaign_info_account).keywords = Vec::new();
    for i in 0..keywords.len() {
        require!((keywords[i].len() >= MIN_SIZE_OF_KEYWORD_STRING) && (keywords[i].len() <= MAX_SIZE_OF_KEYWORD_STRING), CampaignError::InvalidKeywordSize);
        (*ctx.accounts.campaign_info_account).keywords.push(keywords[i].clone());
    }

    (*ctx.accounts.campaign_info_account).begin_unix_timestamp = begin_timestamp;
    (*ctx.accounts.campaign_info_account).end_unix_timestamp = end_timestamp;
    (*ctx.accounts.campaign_info_account).state = CampaignState::Initialized;
    (*ctx.accounts.campaign_info_account).id_db = id_db;
    (*ctx.accounts.campaign_info_account).campaign_counter = campaign_counter;

    (*ctx.accounts.campaign_database_account).counter = (*ctx.accounts.campaign_database_account).counter.checked_add(1).unwrap();

    msg!("Create CampaignInfo: {}", name);
    msg!("User: {}", ctx.accounts.campaign_info_account.user);
    msg!("Name: {}", ctx.accounts.campaign_info_account.name);

    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_db: u64, _campaign_counter: u64)]
pub struct InitCampaignHandles<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = ANCHOR_DESCRIMINATOR_SIZE + CampaignInfo::INIT_SPACE,
        seeds = [b"cpn_hndl", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()], 
        bump,
    )]
    campaign_handles_account: Box<Account<'info, CampaignHandles>>,
    #[account(
        mut,
        has_one = user,
        seeds = [b"cpn_info", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump
    )]
    campaign_info_account: Box<Account<'info, CampaignInfo>>,
 
    // System program
    system_program: Program<'info, System>,
}

pub fn init_campaign_handles(
    ctx: Context<InitCampaignHandles>,
    _id_db: u64,
    _campaign_counter: u64,
) -> Result<()> {
    require!(ctx.accounts.campaign_info_account.state == CampaignState::Initialized, CampaignError::CampaignInvalidState);

    (*ctx.accounts.campaign_handles_account).handles = Vec::new();
    (*ctx.accounts.campaign_info_account).state = CampaignState::HandlesReady;

    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_db: u64, _campaign_counter: u64)]
pub struct InitCampaignAssets<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = ANCHOR_DESCRIMINATOR_SIZE + CampaignInfo::INIT_SPACE,
        seeds = [b"cpn_asst", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()], 
        bump,
    )]
    campaign_assets_account: Box<Account<'info, CampaignAssets>>,
    #[account(
        mut,
        has_one = user,
        seeds = [b"cpn_info", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump,
    )]
    campaign_info_account: Box<Account<'info, CampaignInfo>>,
 
    // System program
    system_program: Program<'info, System>,
}

pub fn init_campaign_assets(
    ctx: Context<InitCampaignAssets>,
    _id_db: u64,
    _campaign_counter: u64,
) -> Result<()> {
    require!((*ctx.accounts.campaign_info_account).state == CampaignState::HandlesReady, CampaignError::CampaignInvalidState);
    (*ctx.accounts.campaign_info_account).state = CampaignState::AssetsReady;

    Ok(())
}

#[derive(Accounts)]
#[instruction(id_db: u64, campaign_counter: u64)]
pub struct OpenCampaign<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"cpn_asst", &id_db.to_le_bytes(), &campaign_counter.to_le_bytes()], 
        bump,
    )]
    campaign_assets_account: Box<Account<'info, CampaignAssets>>,
    #[account(
        mut,
        has_one = user,
        seeds = [b"cpn_info", &id_db.to_le_bytes(), &campaign_counter.to_le_bytes()],
        bump,
    )]
    campaign_info_account: Box<Account<'info, CampaignInfo>>,
    #[account(
        mut,
        seeds = [b"campg-db", &id_db.to_le_bytes()],
        bump,
    )]
    campaign_database_account: Box<Account<'info, CampaignDatabase>>,
 
    // Token accounts
    #[account(mut)]
    pub project_wallet: SystemAccount<'info>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = user,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_account,
        associated_token::authority = campaign_assets_account,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_account,
        associated_token::authority = project_wallet,
    )]
    pub recipient_fee_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    // System program
    system_program: Program<'info, System>,
}

pub fn open_campaign(
    ctx: Context<OpenCampaign>,
    id_db: u64,
    campaign_counter: u64,
    token_amount_in_decimals: u64,
    service_fee_index: usize,
    token_name: String,
    token_symbol: String,
    token_decimals: u8,
) -> Result<()> {
    require!(ctx.accounts.campaign_info_account.state == CampaignState::AssetsReady, CampaignError::CampaignInvalidState);
    let campaign_database = &ctx.accounts.campaign_database_account;
    require!((*campaign_database).id == id_db, CampaignError::InvalidDabaseId);
    require!(((*campaign_database).counter - 1) == campaign_counter, CampaignError::InvalidCampaignCounter);
    require!(service_fee_index < (*campaign_database).service_fee.len(), CampaignError::InvalidServiceFeeIndex);
  
    require!((token_name.len() >= MIN_TOKEN_NAME_AND_SYMBOL_SIZE) && (token_name.len() <= MAX_TOKEN_NAME_SIZE), CampaignError::InvalidCampaignTokenName);
    require!((token_symbol.len() >= MIN_TOKEN_NAME_AND_SYMBOL_SIZE) && (token_symbol.len() <= MAX_TOKEN_SYMBOL_SIZE), CampaignError::InvalidCampaignTokenSymbol);

    msg!("Len: {}", (*campaign_database).service_fee.len());
    require!(campaign_database.service_fee[service_fee_index].token_fee_percentage <= 100, CampaignError::InvalidServiceFee);

    // Transfer SOL if required
    if campaign_database.service_fee[service_fee_index].lamport_fee > 0
    {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info().clone(),
                to: ctx.accounts.project_wallet.to_account_info().clone(),
            },
        );
        system_program::transfer(cpi_context, campaign_database.service_fee[service_fee_index].lamport_fee as u64)?;
    }

    // Transfer token (fee and storage for reward)
    require!(token_amount_in_decimals >= MIN_NUMBER_OF_CAMPAIGN_TOKEN as u64, CampaignError::NotEnoughToken);
    let mut fee_token_to_transfer: u64 = 0;
    if campaign_database.service_fee[service_fee_index].token_fee_percentage > 0 {
        fee_token_to_transfer = token_amount_in_decimals * campaign_database.service_fee[service_fee_index].token_fee_percentage as u64 / 100;
        campaign_transfer_tokens_in_decimals(&ctx, fee_token_to_transfer, true)?;
    }
    let token_to_transfer = token_amount_in_decimals - fee_token_to_transfer;
    campaign_transfer_tokens_in_decimals(&ctx, token_to_transfer, false)?;

    (*ctx.accounts.campaign_info_account).state = CampaignState::Open;
    (*ctx.accounts.campaign_assets_account).mint_account_key = ctx.accounts.mint_account.key();
    (*ctx.accounts.campaign_assets_account).token_amount_in_decimals = token_amount_in_decimals;
    (*ctx.accounts.campaign_assets_account).remaining_token = token_amount_in_decimals;
    (*ctx.accounts.campaign_assets_account).token_name = token_name;
    (*ctx.accounts.campaign_assets_account).token_symbol = token_symbol;
    (*ctx.accounts.campaign_assets_account).token_decimals = token_decimals;
    (*ctx.accounts.campaign_assets_account).copied_service_fee = ctx.accounts.campaign_database_account.service_fee[service_fee_index].clone();

    Ok(())
}

fn campaign_transfer_tokens_in_decimals(
    ctx: &Context<OpenCampaign>,
    token_amount_in_decimals: u64,
    is_fee: bool,
)-> Result<()> {
    let get_recipient_account_key  = |     | (if is_fee {
        ctx.accounts.recipient_fee_account.key().clone()
    }
    else {
        ctx.accounts.recipient_token_account.key().clone()
    });

    msg!("Transferring tokens...");
    msg!(
        "Mint: {}",
        &ctx.accounts.mint_account.to_account_info().key()
    );
    msg!(
        "From Token Address: {}",
        &ctx.accounts.sender_token_account.key()
    );
    msg!(
        "To Token Address: {}", &get_recipient_account_key()
    );

    // Invoke the transfer instruction on the token program
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: (if is_fee {
                    ctx.accounts.recipient_fee_account.to_account_info()
                }
                else {
                    ctx.accounts.recipient_token_account.to_account_info()
                }),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        token_amount_in_decimals, // Transfer amount in decimals
    )?;

    msg!("Tokens transferred successfully.");
    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_db: u64, _campaign_counter: u64)]
pub struct RegisterHandle<'info> {
    user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"cpn_info", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump,
    )]
    campaign_info_account: Box<Account<'info, CampaignInfo>>,
    #[account(
        mut,
        seeds = [b"cpn_hndl", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump
    )]
    campaign_handles_account: Box<Account<'info, CampaignHandles>>,
    system_program: Program<'info, System>,
}

pub fn register_handle(
    ctx: Context<RegisterHandle>,
    _id_db: u64,
    _campaign_counter: u64,
    handle_name: String,
) -> Result<()> {
    require!((*ctx.accounts.campaign_info_account).state == CampaignState::Open, CampaignError::NotOpen);
    require!((*ctx.accounts.campaign_handles_account).handles.len() < MAX_NUMBER_OF_X_HANDLE_PER_CAMPAIGN, CampaignError::HandleNumberLimitReached);
    let clock: Clock = Clock::get()?;
    require!((*ctx.accounts.campaign_info_account).end_unix_timestamp > clock.unix_timestamp, CampaignError::NotOpen);
    require!((handle_name.len() >= MIN_HANDLE_SIZE) && (handle_name.len() <= MAX_HANDLE_SIZE), CampaignError::InvalidXHandle);

    let mut i = 0;
    while i < (*ctx.accounts.campaign_handles_account).handles.len() {
        if ((*ctx.accounts.campaign_handles_account).handles[i].handle_pubkey == ctx.accounts.user.key()) || ((*ctx.accounts.campaign_handles_account).handles[i].handle_name == handle_name)
        {
            return err!(CampaignError::AlreadyRegistered)
        }
        i = i + 1;
    }   

    let handle = Handle {
        handle_name: handle_name,
        handle_pubkey: ctx.accounts.user.key(),
        percent_reward: 0,
        claimed: false,
    };

    (*ctx.accounts.campaign_handles_account).handles.push(handle);

    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_db: u64, _campaign_counter: u64)]
pub struct Claim<'info> {
    #[account(mut)]
    sender: Signer<'info>,

    #[account(
        mut,
        seeds = [b"cpn_info", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump,
    )]
    campaign_info_account: Box<Account<'info, CampaignInfo>>,

    #[account(
        mut,
        seeds = [b"cpn_asst", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()], 
        bump
    )]
    campaign_assets_account: Box<Account<'info, CampaignAssets>>,

    #[account(
        mut,
        seeds = [b"cpn_hndl", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump
    )]
    campaign_handles_account: Box<Account<'info, CampaignHandles>>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = campaign_assets_account,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint_account,
        associated_token::authority = sender,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    // System program
    system_program: Program<'info, System>,
}

pub fn claim(
    ctx: Context<Claim>,
    _id_db: u64,
    _campaign_counter: u64,
) -> Result<()> {
    require!(ctx.accounts.mint_account.key() == (*ctx.accounts.campaign_assets_account).mint_account_key, CampaignError::InvalidMintAccount);
    require!((*ctx.accounts.campaign_info_account).state == CampaignState::Closed, CampaignError::NotOpen);

    let mut i = 0;
    while i < (*ctx.accounts.campaign_handles_account).handles.len() {
        if (*ctx.accounts.campaign_handles_account).handles[i].handle_pubkey == ctx.accounts.sender.key()
        {
            require!(!(*ctx.accounts.campaign_handles_account).handles[i].claimed, CampaignError::AlreadyClaimed);
            require!(!(*ctx.accounts.campaign_handles_account).handles[i].percent_reward > 0, CampaignError::NoReward);

            let reward: u64 = (*ctx.accounts.campaign_assets_account).token_amount_in_decimals / (*ctx.accounts.campaign_handles_account).handles[i].percent_reward as u64 * 100;
            let to_transfer = {
                if reward < (*ctx.accounts.campaign_assets_account).remaining_token 
                {
                    reward
                }
                else 
                {
                    (*ctx.accounts.campaign_assets_account).remaining_token 
                }
            };

            claim_transfer_tokens_in_decimals(&ctx, to_transfer)?;

            (*ctx.accounts.campaign_handles_account).handles[i].claimed = true;
            (*ctx.accounts.campaign_assets_account).remaining_token = {
                if reward < (*ctx.accounts.campaign_assets_account).remaining_token 
                {
                    (*ctx.accounts.campaign_assets_account).remaining_token - reward
                }
                else 
                {
                    0    
                }
            };
            return Ok(())
        }
        i = i + 1;
    }

    err!(CampaignError::NotRegistered)
}

// TODO: To optimize. This is almost the same function as campaign_transfer_tokens
fn claim_transfer_tokens_in_decimals(
    ctx: &Context<Claim>,
    token_amount_in_decimals: u64,
)-> Result<()> {
    msg!("Transferring tokens...");
    msg!(
        "Mint: {}",
        &ctx.accounts.mint_account.to_account_info().key()
    );
    msg!(
        "From Token Address: {}",
        &ctx.accounts.sender_token_account.key()
    );
    msg!(
        "To Token Address: {}", &ctx.accounts.recipient_token_account.key()
    );

    let id_db_bytes = ctx.accounts.campaign_info_account.id_db.to_le_bytes();
    let campaign_counter_bytes = ctx.accounts.campaign_info_account.campaign_counter.to_le_bytes();

    let seeds: &[&[u8]] = &[
        b"cpn_asst",
        &id_db_bytes,
        &campaign_counter_bytes,
        &[ctx.bumps.campaign_assets_account], // Bump as a single byte slice
    ];

    // Invoke the transfer instruction on the token program
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.campaign_assets_account.to_account_info(),
            },
            &[seeds],
        ),
        token_amount_in_decimals, // Transfer amount, adjust for decimals
    )?;

    msg!("Tokens transferred successfully.");
    Ok(())
}

#[derive(Accounts)]
#[instruction(_id_config: u64, _id_db: u64, _campaign_counter: u64)]
pub struct AdminSendRewardPercentages<'info> {
    #[account(
        has_one = admin,
        seeds = [b"admin-cf", &_id_config.to_le_bytes()],
        bump
    )]
    admin_config: Account<'info, AdminConfig>,
    admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"cpn_info", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump
    )]
    campaign_info_account: Box<Account<'info, CampaignInfo>>,
    #[account(
        mut,
        seeds = [b"cpn_hndl", &_id_db.to_le_bytes(), &_campaign_counter.to_le_bytes()],
        bump
    )]
    campaign_handles_account: Box<Account<'info, CampaignHandles>>,
    system_program: Program<'info, System>,
}

pub fn admin_send_reward_percentages(
    ctx: Context<AdminSendRewardPercentages>,
    _id_config: u64,
    _id_db: u64,
    _campaign_counter: u64,
    rewards: Vec<UserReward>,
) -> Result<()> {
    require!((*ctx.accounts.campaign_info_account).state == CampaignState::Open, CampaignError::NotOpen);
    require!((*ctx.accounts.campaign_handles_account).handles.len() == rewards.len(), CampaignError::InvalidHandles);
    let clock: Clock = Clock::get()?;
    require!((*ctx.accounts.campaign_info_account).end_unix_timestamp < clock.unix_timestamp, CampaignError::TimeNotElapsed);

    let mut i = 0;
    let mut percentage_acc: u8 = 0;

    while i < (*ctx.accounts.campaign_handles_account).handles.len() {
        require!((*ctx.accounts.campaign_handles_account).handles[i].handle_name == rewards[i].name, CampaignError::InvalidHandles);
        percentage_acc += rewards[i].percentage;
        (*ctx.accounts.campaign_handles_account).handles[i].percent_reward = rewards[i].percentage;
        (*ctx.accounts.campaign_handles_account).handles[i].claimed = false;
        i = i + 1;
    }
    require!(percentage_acc == 100, CampaignError::InvalidPercentagesForRewards);

    (*ctx.accounts.campaign_info_account).state = CampaignState::Closed;
    Ok(())
}

