/**
 * 가치토큰 시스템 전체 검증 스크립트
 * 모든 데이터 문제를 찾아내고 리포트를 생성합니다
 */

import { db } from "../server/db";
import { batchMembers, tokens, folders } from "@shared/schema";
import { isNull, eq, sql, or, and } from "drizzle-orm";

interface ValidationIssue {
  type: string;
  severity: "error" | "warning" | "info";
  memberId?: number;
  tokenId?: number;
  name?: string;
  email?: string;
  description: string;
  data?: any;
}

const issues: ValidationIssue[] = [];

async function validateBatchMembers() {
  console.log("\n🔍 Batch Members 검증 중...\n");

  // 1. 빈 이름 체크
  const emptyNames = await db
    .select()
    .from(batchMembers)
    .where(
      or(
        isNull(batchMembers.name),
        eq(sql`TRIM(${batchMembers.name})`, "")
      )
    );

  if (emptyNames.length > 0) {
    console.log(`❌ 빈 이름을 가진 멤버: ${emptyNames.length}명`);
    emptyNames.forEach((member) => {
      issues.push({
        type: "empty_member_name",
        severity: "error",
        memberId: member.id,
        name: member.name || "NULL",
        email: member.email || "NULL",
        description: `멤버 ID ${member.id}: 이름이 비어있습니다 (folder_id: ${member.folderId})`,
        data: member,
      });
      console.log(`  - ID ${member.id}: name="${member.name}", email="${member.email}", folder_id=${member.folderId}`);
    });
  } else {
    console.log("✅ 빈 이름을 가진 멤버 없음");
  }

  // 2. 잘못된 이메일 체크
  const invalidEmails = await db
    .select()
    .from(batchMembers)
    .where(
      and(
        sql`${batchMembers.email} IS NOT NULL`,
        sql`${batchMembers.email} != ''`,
        sql`${batchMembers.email} NOT LIKE '%@%'`
      )
    );

  if (invalidEmails.length > 0) {
    console.log(`\n❌ 잘못된 이메일 형식: ${invalidEmails.length}명`);
    invalidEmails.forEach((member) => {
      issues.push({
        type: "invalid_member_email",
        severity: "warning",
        memberId: member.id,
        name: member.name || "NULL",
        email: member.email || "NULL",
        description: `멤버 ID ${member.id}: 이메일에 @가 없습니다`,
        data: member,
      });
      console.log(`  - ID ${member.id}: name="${member.name}", email="${member.email}"`);
    });
  } else {
    console.log("✅ 잘못된 이메일 형식 없음");
  }

  // 3. 특정 사용자 확인 (김상근, 고은정, 이현정)
  const specificUsers = await db
    .select({
      member: batchMembers,
      folderName: folders.name,
    })
    .from(batchMembers)
    .leftJoin(folders, eq(batchMembers.folderId, folders.id))
    .where(
      or(
        sql`${batchMembers.name} LIKE '%김상근%'`,
        sql`${batchMembers.name} LIKE '%고은정%'`,
        sql`${batchMembers.name} LIKE '%이현정%'`
      )
    );

  if (specificUsers.length > 0) {
    console.log(`\n🔍 특정 사용자 상태 확인:`);
    specificUsers.forEach(({ member, folderName }) => {
      const hasIssue =
        !member.name ||
        member.name.trim() === "" ||
        !member.email ||
        !member.email.includes("@");

      const status = hasIssue ? "❌ 문제 있음" : "✅ 정상";
      console.log(`  ${status} - ID ${member.id}: ${member.name} (${member.email}) - ${folderName}`);

      if (hasIssue) {
        issues.push({
          type: "specific_user_issue",
          severity: "error",
          memberId: member.id,
          name: member.name || "NULL",
          email: member.email || "NULL",
          description: `${member.name}: 데이터 문제 발견`,
          data: { member, folderName },
        });
      }
    });
  } else {
    console.log("\n⚠️ 김상근, 고은정, 이현정 중 아무도 찾을 수 없습니다");
  }

  // 4. 중복 이름 체크
  const duplicateNames = await db
    .select({
      folderId: batchMembers.folderId,
      name: batchMembers.name,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(batchMembers)
    .where(
      and(
        sql`${batchMembers.name} IS NOT NULL`,
        sql`TRIM(${batchMembers.name}) != ''`
      )
    )
    .groupBy(batchMembers.folderId, batchMembers.name)
    .having(sql`COUNT(*) > 1`);

  if (duplicateNames.length > 0) {
    console.log(`\n⚠️ 중복된 이름: ${duplicateNames.length}개`);
    duplicateNames.forEach((dup) => {
      issues.push({
        type: "duplicate_member_name",
        severity: "warning",
        name: dup.name || "NULL",
        description: `폴더 ID ${dup.folderId}에 "${dup.name}" 이름이 ${dup.count}개 있습니다`,
        data: dup,
      });
      console.log(`  - 폴더 ${dup.folderId}: "${dup.name}" x${dup.count}`);
    });
  } else {
    console.log("\n✅ 중복된 이름 없음");
  }
}

async function validateTokens() {
  console.log("\n🔍 Tokens 검증 중...\n");

  // 1. 빈 receiverName 체크
  const emptyReceiverNames = await db
    .select()
    .from(tokens)
    .where(
      or(
        isNull(tokens.receiverName),
        eq(sql`TRIM(${tokens.receiverName})`, "")
      )
    );

  if (emptyReceiverNames.length > 0) {
    console.log(`❌ 빈 수령자 이름: ${emptyReceiverNames.length}개`);
    emptyReceiverNames.forEach((token) => {
      issues.push({
        type: "empty_receiver_name",
        severity: "error",
        tokenId: token.id,
        description: `토큰 ID ${token.id}: receiverName이 비어있습니다 (sender: ${token.senderName})`,
        data: token,
      });
      console.log(`  - ID ${token.id}: receiverName="${token.receiverName}", sender="${token.senderName}", amount=${token.amount}`);
    });
  } else {
    console.log("✅ 빈 수령자 이름 없음");
  }

  // 2. receiverEmail과 receiverName 모두 없는 토큰
  const noReceiverInfo = await db
    .select()
    .from(tokens)
    .where(
      and(
        or(
          isNull(tokens.receiverName),
          eq(sql`TRIM(${tokens.receiverName})`, "")
        ),
        or(
          isNull(tokens.receiverEmail),
          eq(sql`TRIM(${tokens.receiverEmail})`, "")
        )
      )
    );

  if (noReceiverInfo.length > 0) {
    console.log(`\n❌ 수령자 정보 없음: ${noReceiverInfo.length}개`);
    noReceiverInfo.forEach((token) => {
      issues.push({
        type: "no_receiver_info",
        severity: "error",
        tokenId: token.id,
        description: `토큰 ID ${token.id}: receiverName과 receiverEmail이 모두 비어있습니다`,
        data: token,
      });
      console.log(`  - ID ${token.id}: sender="${token.senderName}", amount=${token.amount}, status=${token.status}`);
    });
  } else {
    console.log("\n✅ 수령자 정보 없는 토큰 없음");
  }

  // 3. 특정 사용자에게 발행된 토큰
  const specificUserTokens = await db
    .select()
    .from(tokens)
    .where(
      or(
        sql`${tokens.receiverName} LIKE '%김상근%'`,
        sql`${tokens.receiverName} LIKE '%고은정%'`,
        sql`${tokens.receiverName} LIKE '%이현정%'`,
        sql`${tokens.receiverEmail} LIKE '%김상근%'`,
        sql`${tokens.receiverEmail} LIKE '%고은정%'`,
        sql`${tokens.receiverEmail} LIKE '%이현정%'`
      )
    );

  if (specificUserTokens.length > 0) {
    console.log(`\n🔍 특정 사용자 토큰: ${specificUserTokens.length}개`);
    specificUserTokens.forEach((token) => {
      console.log(`  - ID ${token.id}: ${token.senderName} → ${token.receiverName} (${token.receiverEmail}), ${token.amount}원, ${token.status}`);
    });
  } else {
    console.log("\n⚠️ 김상근, 고은정, 이현정에게 발행된 토큰이 없습니다");
  }

  // 4. pending 상태의 토큰들
  const pendingTokens = await db
    .select()
    .from(tokens)
    .where(eq(tokens.status, "pending"));

  console.log(`\n📊 Pending 상태 토큰: ${pendingTokens.length}개`);
}

async function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 검증 리포트");
  console.log("=".repeat(60));

  // 통계
  const totalMembers = await db.select({ count: sql<number>`COUNT(*)` }).from(batchMembers);
  const totalTokens = await db.select({ count: sql<number>`COUNT(*)` }).from(tokens);
  const pendingTokens = await db.select({ count: sql<number>`COUNT(*)` }).from(tokens).where(eq(tokens.status, "pending"));
  const acceptedTokens = await db.select({ count: sql<number>`COUNT(*)` }).from(tokens).where(eq(tokens.status, "accepted"));

  console.log(`\n📈 전체 통계:`);
  console.log(`  - 총 멤버 수: ${totalMembers[0].count}`);
  console.log(`  - 총 토큰 수: ${totalTokens[0].count}`);
  console.log(`  - Pending 토큰: ${pendingTokens[0].count}`);
  console.log(`  - Accepted 토큰: ${acceptedTokens[0].count}`);

  // 문제 요약
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  console.log(`\n🚨 발견된 문제:`);
  console.log(`  - 에러: ${errors.length}개`);
  console.log(`  - 경고: ${warnings.length}개`);

  if (errors.length > 0) {
    console.log(`\n❌ 에러 상세:`);
    errors.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.description}`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️ 경고 상세:`);
    warnings.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.description}`);
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`\n✅ 모든 검증 통과! 시스템이 정상입니다.`);
  } else {
    console.log(`\n\n💡 권장 조치:`);
    console.log(`  1. verify_token_system.sql 파일의 수정 쿼리를 실행하세요`);
    console.log(`  2. 또는 관리자 페이지에서 문제가 있는 멤버를 수정하세요`);
    console.log(`  3. 수정 후 이 스크립트를 다시 실행해서 확인하세요`);
  }

  console.log("\n" + "=".repeat(60));
}

async function main() {
  try {
    console.log("🚀 가치토큰 시스템 검증 시작...");

    await validateBatchMembers();
    await validateTokens();
    await generateReport();

    console.log("\n✅ 검증 완료!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ 검증 중 오류 발생:", error);
    process.exit(1);
  }
}

main();
