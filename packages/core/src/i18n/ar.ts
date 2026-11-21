import type { Translation } from './types.js';

/**
 * Arabic interface texts: a draft pending the native Egyptian Arabic review (FR-020 note, OQ-03).
 * Numbers are never written here in Arabic-Indic digits (FR-022), which the key check enforces.
 */
export const ar = {
  app: {
    name: 'مصاريف',
  },
  language: {
    name: 'العربية',
  },
  home: {
    release: 'الإصدار',
  },
  status: {
    loading: 'جارٍ التحميل…',
  },
  errors: {
    generic: 'حدث خطأ. حاول مرة أخرى.',
    network: 'تعذّر الاتصال بمصاريف. تحقق من اتصالك وحاول مرة أخرى.',
    reference: 'رقم مرجع الخطأ',
  },
  actions: {
    retry: 'حاول مرة أخرى',
  },
  notFound: {
    title: 'الصفحة غير موجودة',
    home: 'اذهب إلى الصفحة الرئيسية',
  },
  placeholder: {
    body: 'هذه الصفحة غير متاحة بعد.',
  },
  pages: {
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    verifyEmail: 'تأكيد البريد الإلكتروني',
    resetPassword: 'إعادة تعيين كلمة المرور',
    expenses: 'المصاريف',
    newExpense: 'إضافة مصروف',
    expense: 'مصروف',
    summary: 'ملخص الشهر',
    settings: 'الإعدادات',
    deleteAccount: 'حذف الحساب',
    download: 'تنزيل تطبيق أندرويد',
    privacy: 'سياسة الخصوصية',
    terms: 'شروط الاستخدام',
  },
} as const satisfies Translation;
