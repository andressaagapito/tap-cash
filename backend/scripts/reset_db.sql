-- Execute no banco tapcash para limpar estado parcial da migration falha
-- psql -U tapcash -d tapcash -f scripts/reset_db.sql

DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS user_financial_profiles CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS alembic_version CASCADE;
DROP TYPE IF EXISTS expensestatus CASCADE;
DROP TYPE IF EXISTS expensetype CASCADE;
