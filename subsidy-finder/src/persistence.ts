// 앱인토스 출시 기준의 '사용자 식별키 발급'과 '다시 접속해도 데이터 유지'를 맡아요.
// 식별키(익명 키)를 받아 저장하고, 마지막 검색 조건을 사용자별로 저장·복원해요.
import { Storage, User } from "@apps-in-toss/web-framework";

import type { SearchFilter } from "./benefits";

const USER_KEY = "userKey";
const conditionsKey = (userKey: string) => `lastConditions:${userKey}`;

/** 익명 사용자 키를 받아 저장해요. 지원하지 않거나 실패하면 저장된 값(없으면 "guest")을 써요. */
export async function loadUserKey(): Promise<string> {
  try {
    if (User.getAnonymousKey.isSupported()) {
      const { hash } = await User.getAnonymousKey();
      await Storage.setItem(USER_KEY, hash);
      return hash;
    }
  } catch {
    // 실패해도 앱은 계속 쓸 수 있게 저장된 값으로 이어가요.
  }
  try {
    return (await Storage.getItem(USER_KEY)) ?? "guest";
  } catch {
    return "guest";
  }
}

export type SavedConditions = Omit<SearchFilter, "age"> & { age: string };

export async function loadConditions(userKey: string): Promise<SavedConditions | null> {
  try {
    const raw = await Storage.getItem(conditionsKey(userKey));
    return raw ? (JSON.parse(raw) as SavedConditions) : null;
  } catch {
    return null;
  }
}

export async function saveConditions(userKey: string, conditions: SavedConditions) {
  try {
    await Storage.setItem(conditionsKey(userKey), JSON.stringify(conditions));
  } catch {
    // 저장에 실패해도 검색은 그대로 진행해요.
  }
}
