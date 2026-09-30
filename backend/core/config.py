from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Support-618 API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # URLs
    FRONTEND_URL: str = "http://localhost:3000"

    # Stripe Configuration
    STRIPE_SECRET_KEY: str = "sk_test_mock_stackton_secret_key"
    STRIPE_WEBHOOK_SECRET: str = "whsec_mock_stackton_webhook_secret"

    # AWS SES & SNS Configuration
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = "mock_aws_access_key"
    AWS_SECRET_ACCESS_KEY: str = "mock_aws_secret_key"
    AWS_SES_SENDER_EMAIL: str = "support@stackton.io"
    
    # Cost Control: SMS Quota per User per 24 hours (Anti-Spam & Fraud protection)
    SNS_MAX_SMS_PER_USER_DAY: int = 3

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/support_618"

    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
