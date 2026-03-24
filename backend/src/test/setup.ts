// Test environment setup
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.LOG_LEVEL = 'error'; // Suppress logs in tests
process.env.UPLOADS_DIR = '/tmp/test-uploads';
