CREATE DATABASE IF NOT EXISTS identity_db;
CREATE DATABASE IF NOT EXISTS chat_db;

GRANT ALL PRIVILEGES ON identity_db.* TO 'messenger_admin'@'%';
GRANT ALL PRIVILEGES ON chat_db.* TO 'messenger_admin'@'%';
