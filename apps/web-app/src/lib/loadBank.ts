import type { QuizBank } from './types';
import { QuizBankProtector, type ProtectedQuizBank } from './quizProtection';

export const revalidate = 0;

export async function loadBank(): Promise<QuizBank> {
  try {
    const res = await fetch("/api/bank", { 
      cache: "no-store",
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Bank fetch failed: ${res.status} ${res.statusText}`);
    }
    
    const bank = await res.json();
    
    // Validate the bank structure
    if (!bank.version || !bank.baseItems || !bank.tbBlocks) {
      throw new Error("Invalid bank structure");
    }
    
    // Check protection status (dev-team only)
    if (QuizBankProtector.isLocked(bank as ProtectedQuizBank)) {
      console.info("🔒 DEV: Quiz bank locked with code 5339855");
    }
    
    return bank as QuizBank;
  } catch (error) {
    console.error("Failed to load bank:", error);
    throw error;
  }
}

// Fallback to static import if API fails
export async function loadBankWithFallback(): Promise<QuizBank> {
  try {
    return await loadBank();
  } catch (error) {
    console.warn("API load failed, falling back to static import:", error);
    const bankData = (await import("@/data/quizBank_primary_only.json")).default;
    
    // Check protection status on fallback (dev-team only)
    if (QuizBankProtector.isLocked(bankData as ProtectedQuizBank)) {
      console.info("🔒 DEV: Fallback quiz bank locked with code 5339855");
    }
    
    return bankData as QuizBank;
  }
}

// New function to check protection status
export function getBankProtectionStatus(bank: QuizBank) {
  return QuizBankProtector.getProtectionStatus(bank as ProtectedQuizBank);
}

// New function to verify unlock code
export function verifyUnlockCode(code: string): boolean {
  return QuizBankProtector.verifyCode(code);
}
