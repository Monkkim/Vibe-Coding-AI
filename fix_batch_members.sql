-- 가치토큰 시스템 버그 수정을 위한 데이터베이스 정리 스크립트
-- 문제: 김상근, 고은정 사용자에게 토큰 발행 시 오류 발생
-- 원인: batch_members 테이블의 name 또는 email 필드에 문제가 있을 가능성

-- 1. 문제가 있는 batch_members 레코드 확인
-- (name이 null, 빈 문자열, 또는 whitespace만 있는 경우)
SELECT
    id,
    folder_id,
    name,
    email,
    user_id,
    LENGTH(name) as name_length,
    LENGTH(TRIM(name)) as trimmed_name_length
FROM batch_members
WHERE
    name IS NULL
    OR TRIM(name) = ''
    OR LENGTH(TRIM(name)) = 0
ORDER BY id;

-- 2. 특정 사용자 이름으로 검색 (김상근, 고은정)
SELECT
    id,
    folder_id,
    name,
    email,
    user_id,
    created_at,
    joined_at
FROM batch_members
WHERE
    name LIKE '%김상근%'
    OR name LIKE '%고은정%'
ORDER BY id;

-- 3. 이메일이 null이거나 잘못된 형식인 레코드 확인
SELECT
    id,
    folder_id,
    name,
    email,
    user_id
FROM batch_members
WHERE
    email IS NULL
    OR email = ''
    OR email NOT LIKE '%@%'
ORDER BY id;

-- 4. 해당 사용자들이 받은 토큰 확인
SELECT
    t.id,
    t.receiver_name,
    t.receiver_email,
    t.sender_name,
    t.amount,
    t.status,
    t.created_at
FROM tokens t
WHERE
    t.receiver_name LIKE '%김상근%'
    OR t.receiver_name LIKE '%고은정%'
ORDER BY t.created_at DESC;

-- 5. 데이터 수정 (실행 전에 반드시 백업하세요!)
-- 예시: name이 null이거나 빈 문자열인 경우 email을 name으로 사용
-- UPDATE batch_members
-- SET name = COALESCE(NULLIF(TRIM(name), ''), email, 'Unknown')
-- WHERE name IS NULL OR TRIM(name) = '';

-- 6. 특정 사용자의 name을 수정하는 예시
-- (실제 실행 전에 id와 새로운 이름을 확인하세요)
-- UPDATE batch_members
-- SET name = '김상근'
-- WHERE id = [해당 ID];

-- UPDATE batch_members
-- SET name = '고은정'
-- WHERE id = [해당 ID];

-- 7. 수정 후 관련 토큰의 receiver_name도 업데이트
-- (storage.ts의 updateBatchMember 함수가 자동으로 처리하지만, 수동으로도 가능)
-- UPDATE tokens
-- SET receiver_name = (SELECT name FROM batch_members WHERE batch_members.id = tokens.to_user_id::integer)
-- WHERE to_user_id IN (SELECT id::text FROM batch_members WHERE name = '김상근' OR name = '고은정');

-- 8. 검증: 수정 후 다시 확인
-- SELECT
--     id,
--     name,
--     email,
--     LENGTH(TRIM(name)) as name_length
-- FROM batch_members
-- WHERE name LIKE '%김상근%' OR name LIKE '%고은정%';
