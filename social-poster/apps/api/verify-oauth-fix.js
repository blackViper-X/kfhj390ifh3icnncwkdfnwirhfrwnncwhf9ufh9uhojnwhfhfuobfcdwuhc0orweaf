/**
 * Verification harness for the OAuth callback crash.
 *
 * Reproduces the original failure:
 *   TypeError [ERR_INVALID_ARG_TYPE]: The "data" argument must be of type string...
 *     at encrypt (utils/encryption.js:11)
 *     at saveOAuthCredential (services/socialAccountService.js:64)
 *
 * Run: node verify-oauth-fix.js
 */
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.JWT_SECRET = 'test-secret-for-verification';

const http = require('http');
const assert = require('assert');

const { encrypt, decrypt, encryptToString, decryptFromString } = require('./src/utils/encryption');
const { makeRequest } = require('./src/utils/apiClient');
const { generateOAuthState, verifyOAuthState } = require('./src/adapters/social/oauthState');

let passed = 0;
let failed = 0;

function check(name, fn) {
    return Promise.resolve()
        .then(fn)
        .then(() => {
            passed++;
            console.log(`  PASS  ${name}`);
        })
        .catch((err) => {
            failed++;
            console.log(`  FAIL  ${name}\n          ${err.message}`);
        });
}

/**
 * Mock OAuth provider reproducing how Facebook/Google actually respond
 * to a bad authorization code: HTTP 400 with a JSON error body.
 */
function startMockProvider() {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost');

        if (url.pathname === '/oauth/access_token-error') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(
                JSON.stringify({
                    error: {
                        message: 'This authorization code has been used.',
                        type: 'OAuthException',
                        code: 100,
                        error_subcode: 36009,
                    },
                })
            );
        }

        if (url.pathname === '/oauth/access_token-empty') {
            // 200 OK but no access_token: the exact shape that used to slip
            // through and reach encrypt() as undefined.
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ some_other_field: 'no token here' }));
        }

        if (url.pathname === '/oauth/access_token-ok') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ access_token: 'REAL_TOKEN_123', expires_in: 5184000 }));
        }

        res.writeHead(404);
        res.end('{}');
    });

    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

async function main() {
    console.log('\nOAuth callback crash — verification\n');
    const server = await startMockProvider();
    const base = `http://127.0.0.1:${server.address().port}`;

    console.log('encryption');

    await check('encrypt() rejects undefined with a clear message (was ERR_INVALID_ARG_TYPE)', () => {
        assert.throws(() => encrypt(undefined), (err) => {
            assert.ok(err instanceof TypeError, 'should be a TypeError');
            assert.ok(
                /expects a non-empty string/.test(err.message),
                `message should be descriptive, got: ${err.message}`
            );
            assert.ok(
                /OAuth token exchange/.test(err.message),
                'message should point at the real cause'
            );
            return true;
        });
    });

    await check('encrypt() rejects null and empty string', () => {
        assert.throws(() => encrypt(null), TypeError);
        assert.throws(() => encrypt(''), TypeError);
    });

    await check('encrypt()/decrypt() round-trips a real token', () => {
        const { encrypted, iv, authTag } = encrypt('REAL_TOKEN_123');
        assert.strictEqual(decrypt(encrypted, iv, authTag), 'REAL_TOKEN_123');
    });

    await check('invalid ENCRYPTION_KEY length fails with guidance', () => {
        const original = process.env.ENCRYPTION_KEY;
        delete require.cache[require.resolve('./src/config')];
        delete require.cache[require.resolve('./src/utils/encryption')];
        process.env.ENCRYPTION_KEY = 'tooshort';
        const enc = require('./src/utils/encryption');
        assert.throws(() => enc.encrypt('x'), /64-character hex/);
        process.env.ENCRYPTION_KEY = original;
        delete require.cache[require.resolve('./src/config')];
        delete require.cache[require.resolve('./src/utils/encryption')];
    });

    await check('refresh token packs its own IV and round-trips', () => {
        const packed = encryptToString('REFRESH_ABC');
        assert.ok(packed.startsWith('v1:'), 'should be versioned');
        assert.strictEqual(packed.split(':').length, 4);
        assert.strictEqual(decryptFromString(packed), 'REFRESH_ABC');
    });

    await check('two tokens encrypted separately never share an IV', () => {
        const a = encryptToString('TOKEN_A');
        const b = encryptToString('TOKEN_B');
        assert.notStrictEqual(a.split(':')[1], b.split(':')[1], 'IVs must differ');
        assert.strictEqual(decryptFromString(a), 'TOKEN_A');
        assert.strictEqual(decryptFromString(b), 'TOKEN_B');
    });

    await check('access-token IV cannot decrypt the refresh token (the old bug)', () => {
        // Old code stored the refresh ciphertext against the access token's IV.
        const access = encrypt('ACCESS_TOKEN');
        const refresh = encrypt('REFRESH_TOKEN');
        assert.throws(
            () => decrypt(refresh.encrypted, access.iv, access.authTag),
            'mismatched IV/authTag must fail loudly, proving the old pairing was broken'
        );
    });

    console.log('\napiClient error handling');

    await check('HTTP 400 now throws instead of returning an error body', async () => {
        await assert.rejects(
            () => makeRequest({ url: `${base}/oauth/access_token-error`, method: 'GET', retries: 0 }),
            (err) => {
                assert.strictEqual(err.status, 400);
                assert.ok(
                    /This authorization code has been used/.test(err.message),
                    `should carry the provider message, got: ${err.message}`
                );
                assert.ok(/code=100/.test(err.message), 'should include the provider error code');
                return true;
            }
        );
    });

    await check('4xx is not retried (fails fast)', async () => {
        const started = Date.now();
        await assert.rejects(() =>
            makeRequest({ url: `${base}/oauth/access_token-error`, method: 'GET' })
        );
        assert.ok(Date.now() - started < 1000, 'must not back off on a 4xx');
    });

    await check('a valid 200 response still passes through', async () => {
        const res = await makeRequest({ url: `${base}/oauth/access_token-ok`, method: 'GET' });
        assert.strictEqual(res.data.access_token, 'REAL_TOKEN_123');
    });

    console.log('\nadapter token-exchange guards');

    await check('adapters reject a 200 response that carries no access_token', async () => {
        const { makeRequest: mr } = require('./src/utils/apiClient');
        const response = await mr({ url: `${base}/oauth/access_token-empty`, method: 'GET' });
        // This is precisely the value that used to reach encrypt().
        assert.strictEqual(response.data.access_token, undefined);
        assert.throws(() => encrypt(response.data.access_token), /expects a non-empty string/);
    });

    console.log('\noauth state');

    await check('state carries userId through the redirect', () => {
        const state = generateOAuthState('company-1', 'FACEBOOK', 'user-42');
        const data = verifyOAuthState(state);
        assert.strictEqual(data.companyId, 'company-1');
        assert.strictEqual(data.platform, 'FACEBOOK');
        assert.strictEqual(data.userId, 'user-42', 'userId is needed for the audit log FK');
    });

    await check('a tampered state is rejected', () => {
        const state = generateOAuthState('company-1', 'FACEBOOK', 'user-42');
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        decoded.payload = JSON.stringify({
            companyId: 'attacker-company',
            platform: 'FACEBOOK',
            userId: 'user-42',
            timestamp: Date.now(),
        });
        const forged = Buffer.from(JSON.stringify(decoded)).toString('base64url');
        assert.throws(() => verifyOAuthState(forged), /Invalid state signature/);
    });

    await check('an expired state is rejected', () => {
        const payload = JSON.stringify({
            companyId: 'c',
            platform: 'FACEBOOK',
            userId: 'u',
            timestamp: Date.now() - 700000,
        });
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET);
        hmac.update(payload);
        const state = Buffer.from(
            JSON.stringify({ payload, signature: hmac.digest('hex') })
        ).toString('base64url');
        assert.throws(() => verifyOAuthState(state), /expired/);
    });

    console.log('\nadapter surface');

    await check('every adapter exposes getAccountInfo (instagram was missing it)', () => {
        const { getAdapter } = require('./src/adapters/social');
        for (const platform of ['FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'YOUTUBE_SHORTS', 'PINTEREST']) {
            const adapter = getAdapter(platform);
            assert.strictEqual(
                typeof adapter.getAccountInfo,
                'function',
                `${platform}.getAccountInfo must exist — the OAuth callback calls it`
            );
            assert.strictEqual(typeof adapter.exchangeCodeForTokens, 'function');
            assert.strictEqual(typeof adapter.refreshAccessToken, 'function');
        }
    });

    server.close();

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
}

main();
