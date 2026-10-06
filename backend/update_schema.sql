-- Adicionar coluna 'name' à tabela users se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Atualizar registos existentes com um nome padrão se necessário
UPDATE users SET name = 'Utilizador' WHERE name IS NULL;

-- Verificar a estrutura da tabela
\d users;
