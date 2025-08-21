export interface QuizProtection {
  locked: boolean;
  requiredCode: string;
  lockMessage: string;
  lastModified: string;
  lockedBy: string;
}

export interface ProtectedQuizBank {
  version: string;
  protection: QuizProtection;
  baseItems: any;
  tbBlocks: any;
}

export class QuizBankProtector {
  private static readonly REQUIRED_CODE = "5339855";
  
  /**
   * Check if the quiz bank is locked
   */
  static isLocked(bank: ProtectedQuizBank): boolean {
    return bank.protection?.locked === true;
  }
  
  /**
   * Verify the unlock code
   */
  static verifyCode(code: string): boolean {
    return code === this.REQUIRED_CODE;
  }
  
  /**
   * Attempt to unlock the quiz bank with a code
   */
  static unlockBank(bank: ProtectedQuizBank, code: string): { success: boolean; message: string } {
    if (!this.isLocked(bank)) {
      return { success: true, message: "Quiz bank is already unlocked." };
    }
    
    if (this.verifyCode(code)) {
      return { success: true, message: "✅ Code verified. Quiz bank unlocked for editing." };
    } else {
      return { success: false, message: "❌ Invalid code. Original quiz content remains locked." };
    }
  }
  
  /**
   * Get protection status
   */
  static getProtectionStatus(bank: ProtectedQuizBank): QuizProtection | null {
    return bank.protection || null;
  }
  
  /**
   * Check if content can be modified
   */
  static canModify(bank: ProtectedQuizBank, code?: string): boolean {
    if (!this.isLocked(bank)) return true;
    if (code && this.verifyCode(code)) return true;
    return false;
  }
  
  /**
   * Get lock message
   */
  static getLockMessage(bank: ProtectedQuizBank): string {
    return bank.protection?.lockMessage || "Quiz content is protected.";
  }
}
