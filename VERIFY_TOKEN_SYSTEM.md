# 가치토큰 시스템 검증 가이드

이 문서는 가치토큰 시스템의 모든 데이터를 검증하고 문제를 찾아내는 방법을 안내합니다.

## 🚨 현재 발견된 문제

사용자들이 가치토큰을 수령할 수 없는 문제가 보고되었습니다:
- 김상근
- 고은정
- 이현정
- 기타 다수의 사용자

## 🔍 검증 방법

두 가지 방법으로 시스템을 검증할 수 있습니다:

### 방법 1: Node.js 스크립트 실행 (권장)

터미널에서 다음 명령어를 실행하세요:

```bash
npm run verify:tokens
```

이 스크립트는 자동으로:
1. 모든 batch_members의 데이터 검증
2. 모든 tokens의 데이터 검증
3. 문제가 있는 레코드 리스트 출력
4. 전체 통계 및 리포트 생성

### 방법 2: SQL 쿼리 직접 실행

PostgreSQL 클라이언트에서 `verify_token_system.sql` 파일을 실행하세요:

```bash
psql $DATABASE_URL -f verify_token_system.sql
```

또는 pgAdmin, DBeaver, TablePlus 등의 GUI 도구에서 SQL 파일을 열어 실행하세요.

## 📋 검증 항목

### Batch Members 검증

1. ❌ **빈 이름**: name이 NULL이거나 빈 문자열
   - **영향**: 토큰 발행 시 receiverName이 비어서 오류

2. ❌ **잘못된 이메일**: email이 NULL이거나 @가 없음
   - **영향**: 이메일로 매칭 불가능, 토큰 수령 실패

3. ⚠️ **중복 이름**: 같은 기수에 같은 이름이 여러 명
   - **영향**: 토큰 수령 시 잘못된 사람에게 전달될 수 있음

### Tokens 검증

1. ❌ **빈 수령자 이름**: receiverName이 NULL이거나 빈 문자열
   - **영향**: 수령자 매칭 불가능

2. ❌ **수령자 정보 없음**: receiverName과 receiverEmail 모두 없음
   - **영향**: 수령자를 전혀 특정할 수 없음

3. ⚠️ **잘못된 to_user_id**: batch_member ID인데 해당 멤버가 없음
   - **영향**: 토큰 수령 실패

## 🛠️ 문제 해결 방법

### 1. 빈 이름 수정

batch_members의 name이 비어있는 경우, email 또는 다른 정보로 채워야 합니다:

```sql
-- 먼저 문제가 있는 레코드 확인
SELECT id, name, email, folder_id
FROM batch_members
WHERE name IS NULL OR TRIM(name) = '';

-- 수정 (신중하게!)
UPDATE batch_members
SET name = COALESCE(NULLIF(TRIM(name), ''), email, 'Unknown')
WHERE name IS NULL OR TRIM(name) = '';
```

### 2. 이메일 형식 수정

email이 잘못된 경우, 올바른 이메일로 수정하거나 NULL로 설정:

```sql
-- 문제가 있는 이메일 확인
SELECT id, name, email
FROM batch_members
WHERE email IS NOT NULL AND email NOT LIKE '%@%';

-- 수정: 잘못된 이메일은 NULL로 (또는 올바른 이메일로 수정)
UPDATE batch_members
SET email = NULL
WHERE email IS NOT NULL AND email NOT LIKE '%@%';
```

### 3. 특정 사용자 수정 예시

김상근, 고은정, 이현정의 데이터를 수정:

```sql
-- 먼저 현재 상태 확인
SELECT id, name, email, user_id, folder_id
FROM batch_members
WHERE name LIKE '%김상근%' OR name LIKE '%고은정%' OR name LIKE '%이현정%';

-- 문제가 있다면 수정
-- 예시:
-- UPDATE batch_members SET name = '김상근', email = 'example@email.com' WHERE id = 123;
```

### 4. 토큰의 receiverName 동기화

batch_member의 이름을 수정한 경우, 관련 토큰의 receiverName도 업데이트:

```sql
-- storage.ts의 updateBatchMember 함수가 자동으로 처리하지만, 수동으로도 가능
UPDATE tokens
SET receiver_name = (
    SELECT name FROM batch_members
    WHERE batch_members.id = tokens.to_user_id::integer
)
WHERE to_user_id IN (
    SELECT id::text FROM batch_members
    WHERE name = '김상근' OR name = '고은정' OR name = '이현정'
);
```

## ✅ 검증 완료 후

1. 다시 검증 스크립트 실행:
   ```bash
   npm run verify:tokens
   ```

2. 모든 문제가 해결되었는지 확인

3. 사용자들에게 토큰 수령 다시 시도 요청

## 🔧 코드 수정 사항

다음 파일들이 수정되었습니다:

### `server/routes.ts`

1. **acceptToken 엔드포인트 개선** (256-313줄)
   - 4가지 방법으로 토큰 수령자 확인:
     - receiverEmail 매칭
     - toUserId 매칭
     - batch member name 매칭
     - user identifiers 매칭

2. **createBatchMember 검증 강화** (367-398줄)
   - name 필수 검증
   - email sanitization

3. **updateBatchMember 검증 강화** (405-437줄)
   - name 업데이트 시 검증
   - email sanitization

## 📊 예상 결과

검증 스크립트 실행 후 다음과 같은 출력을 볼 수 있습니다:

```
🚀 가치토큰 시스템 검증 시작...

🔍 Batch Members 검증 중...

❌ 빈 이름을 가진 멤버: 2명
  - ID 123: name="", email="test@example.com", folder_id=1
  - ID 456: name=NULL, email=NULL, folder_id=2

✅ 잘못된 이메일 형식 없음

🔍 특정 사용자 상태 확인:
  ❌ 문제 있음 - ID 123: 김상근 (NULL) - AG 42기
  ✅ 정상 - ID 456: 고은정 (goeun@example.com) - AG 42기
  ✅ 정상 - ID 789: 이현정 (leehj@example.com) - AG 43기

====================================================================
📊 검증 리포트
====================================================================

📈 전체 통계:
  - 총 멤버 수: 50
  - 총 토큰 수: 150
  - Pending 토큰: 25
  - Accepted 토큰: 125

🚨 발견된 문제:
  - 에러: 3개
  - 경고: 1개

❌ 에러 상세:
  1. 멤버 ID 123: 이름이 비어있습니다 (folder_id: 1)
  2. 멤버 ID 123: 데이터 문제 발견
  3. 토큰 ID 789: receiverName이 비어있습니다 (sender: 홍길동)

💡 권장 조치:
  1. verify_token_system.sql 파일의 수정 쿼리를 실행하세요
  2. 또는 관리자 페이지에서 문제가 있는 멤버를 수정하세요
  3. 수정 후 이 스크립트를 다시 실행해서 확인하세요

====================================================================

✅ 검증 완료!
```

## 🆘 문제 발생 시

검증 스크립트 실행 중 오류가 발생하면:

1. DATABASE_URL 환경변수가 설정되어 있는지 확인
2. 데이터베이스 연결이 가능한지 확인
3. PostgreSQL 서버가 실행 중인지 확인

문의사항이 있으면 개발팀에 연락하세요.
