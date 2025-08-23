import { NextResponse } from 'next/server';
import type { QuizBankV2 } from '@/lib/types';

export const revalidate = 0;

export async function GET() {
  try {
    // Import the quiz bank data
    const quizBankData = (await import('@/data/quiz-bank-v2.7.json')).default;
    
    console.log('🔍 Quiz Bank Data Loaded:', {
      version: quizBankData.version,
      families: quizBankData.families,
      familyHoneItemsCount: quizBankData.family_hone_items?.length,
      facesByFamily: quizBankData.faces_by_family ? Object.keys(quizBankData.faces_by_family) : 'missing'
    });
    
    // Validate basic structure
    if (!quizBankData.version || !quizBankData.families || !quizBankData.family_hone_items) {
      throw new Error('Invalid quiz bank v2.7 structure');
    }
    
    return NextResponse.json(quizBankData as unknown as QuizBankV2, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Failed to load quiz bank v2.7:', error);
    return NextResponse.json(
      { error: 'Failed to load quiz bank v2.7' },
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
