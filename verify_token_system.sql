-- ===================================================================
-- 가치토큰 시스템 전체 검증 스크립트
-- 모든 잠재적 문제를 찾아내는 쿼리들
-- ===================================================================

-- 1. ❌ 문제: name이 null이거나 빈 문자열인 batch_members
-- 영향: 토큰 발행 시 receiverName이 비어서 오류 발생
SELECT
    '❌ 빈 이름' as issue_type,
    id,
    folder_id,
    name,
    email,
    user_id,
    LENGTH(name) as name_length,
    LENGTH(TRIM(COALESCE(name, ''))) as trimmed_name_length
FROM batch_members
WHERE
    name IS NULL
    OR TRIM(name) = ''
    OR LENGTH(TRIM(name)) = 0
ORDER BY folder_id, id;

-- 2. ❌ 문제: email이 null이거나 잘못된 형식인 batch_members
-- 영향: 이메일로 매칭 불가능, 토큰 수령 시 문제 발생 가능
SELECT
    '❌ 잘못된 이메일' as issue_type,
    id,
    folder_id,
    name,
    email,
    user_id,
    CASE
        WHEN email IS NULL THEN 'NULL'
        WHEN email = '' THEN '빈 문자열'
        WHEN email NOT LIKE '%@%' THEN '@ 없음'
        ELSE '기타'
    END as email_issue
FROM batch_members
WHERE
    email IS NULL
    OR email = ''
    OR email NOT LIKE '%@%'
ORDER BY folder_id, id;

-- 3. ❌ 문제: receiverName이 비어있는 tokens
-- 영향: 토큰 수령자 매칭 불가능
SELECT
    '❌ 빈 수령자 이름' as issue_type,
    t.id,
    t.batch_id,
    t.receiver_name,
    t.receiver_email,
    t.to_user_id,
    t.sender_name,
    t.amount,
    t.status,
    t.created_at
FROM tokens t
WHERE
    t.receiver_name IS NULL
    OR TRIM(t.receiver_name) = ''
ORDER BY t.created_at DESC;

-- 4. ❌ 문제: receiverEmail과 receiverName이 모두 null인 tokens
-- 영향: 수령자를 전혀 특정할 수 없음
SELECT
    '❌ 수령자 정보 없음' as issue_type,
    t.id,
    t.batch_id,
    t.receiver_name,
    t.receiver_email,
    t.to_user_id,
    t.sender_name,
    t.amount,
    t.status
FROM tokens t
WHERE
    (t.receiver_name IS NULL OR TRIM(t.receiver_name) = '')
    AND (t.receiver_email IS NULL OR TRIM(t.receiver_email) = '')
ORDER BY t.created_at DESC;

-- 5. ⚠️ 경고: to_user_id가 숫자인데 매칭되는 batch_member가 없는 tokens
-- 영향: batch member ID로 찾을 수 없음
SELECT
    '⚠️ 잘못된 to_user_id' as issue_type,
    t.id,
    t.batch_id,
    t.to_user_id,
    t.receiver_name,
    t.receiver_email,
    t.sender_name,
    t.amount,
    t.status
FROM tokens t
WHERE
    t.to_user_id ~ '^[0-9]+$'  -- 숫자 형식인 경우
    AND NOT EXISTS (
        SELECT 1 FROM batch_members bm
        WHERE bm.id::text = t.to_user_id
    )
ORDER BY t.created_at DESC;

-- 6. 🔍 특정 사용자들의 상태 확인 (김상근, 고은정, 이현정)
SELECT
    '🔍 특정 사용자 상태' as check_type,
    bm.id,
    bm.folder_id,
    bm.name,
    bm.email,
    bm.user_id,
    bm.joined_at,
    f.name as batch_name,
    CASE
        WHEN bm.name IS NULL OR TRIM(bm.name) = '' THEN '❌ 이름 없음'
        WHEN bm.email IS NULL OR bm.email NOT LIKE '%@%' THEN '⚠️ 이메일 문제'
        ELSE '✅ 정상'
    END as status
FROM batch_members bm
LEFT JOIN folders f ON bm.folder_id = f.id
WHERE
    bm.name LIKE '%김상근%'
    OR bm.name LIKE '%고은정%'
    OR bm.name LIKE '%이현정%'
ORDER BY bm.name;

-- 7. 🔍 특정 사용자들에게 발행된 토큰 확인
SELECT
    '🔍 특정 사용자 토큰' as check_type,
    t.id,
    t.receiver_name,
    t.receiver_email,
    t.sender_name,
    t.amount,
    t.status,
    t.created_at,
    t.batch_id
FROM tokens t
WHERE
    t.receiver_name LIKE '%김상근%'
    OR t.receiver_name LIKE '%고은정%'
    OR t.receiver_name LIKE '%이현정%'
    OR t.receiver_email LIKE '%김상근%'
    OR t.receiver_email LIKE '%고은정%'
    OR t.receiver_email LIKE '%이현정%'
ORDER BY t.created_at DESC;

-- 8. 📊 전체 통계
SELECT
    '📊 전체 통계' as stats_type,
    (SELECT COUNT(*) FROM batch_members) as total_members,
    (SELECT COUNT(*) FROM batch_members WHERE name IS NULL OR TRIM(name) = '') as members_with_empty_name,
    (SELECT COUNT(*) FROM batch_members WHERE email IS NULL OR email NOT LIKE '%@%') as members_with_invalid_email,
    (SELECT COUNT(*) FROM tokens) as total_tokens,
    (SELECT COUNT(*) FROM tokens WHERE receiver_name IS NULL OR TRIM(receiver_name) = '') as tokens_with_empty_receiver,
    (SELECT COUNT(*) FROM tokens WHERE status = 'pending') as pending_tokens,
    (SELECT COUNT(*) FROM tokens WHERE status = 'accepted') as accepted_tokens;

-- 9. 🔍 중복 이름 체크 (같은 기수에 같은 이름이 여러 명)
SELECT
    '⚠️ 중복 이름' as issue_type,
    bm.folder_id,
    f.name as batch_name,
    bm.name as member_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(bm.id::text, ', ') as member_ids,
    STRING_AGG(COALESCE(bm.email, 'NULL'), ', ') as emails
FROM batch_members bm
LEFT JOIN folders f ON bm.folder_id = f.id
WHERE bm.name IS NOT NULL AND TRIM(bm.name) != ''
GROUP BY bm.folder_id, f.name, bm.name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, bm.folder_id;

-- 10. ✅ 정상적인 멤버 수
SELECT
    '✅ 정상 멤버' as status_type,
    COUNT(*) as count
FROM batch_members
WHERE
    name IS NOT NULL
    AND TRIM(name) != ''
    AND (email IS NULL OR email LIKE '%@%');

-- ===================================================================
-- 실행 방법:
-- psql을 사용하는 경우:
--   psql $DATABASE_URL -f verify_token_system.sql
--
-- 또는 pgAdmin이나 다른 PostgreSQL 클라이언트에서
-- 이 파일을 열어서 실행하세요.
-- ===================================================================
