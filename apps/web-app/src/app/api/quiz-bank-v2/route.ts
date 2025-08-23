import { NextResponse } from 'next/server';
import type { QuizBankV2 } from '@/lib/types';

export const revalidate = 0;

export async function GET() {
  try {
    // Import the quiz bank data
    const quizBankData = (await import('@/data/quiz-bank-v2.6.json')).default;
    
    // Validate basic structure
    if (!quizBankData.version || !quizBankData.families || !quizBankData.family_hone_items) {
      throw new Error('Invalid quiz bank v2.6 structure');
    }
    
    return NextResponse.json(quizBankData as QuizBankV2, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Failed to load quiz bank v2.6:', error);
    return NextResponse.json(
      { error: 'Failed to load quiz bank v2.6' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
