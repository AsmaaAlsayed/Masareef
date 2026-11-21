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
  date: {
    /** Gregorian month names as used in Egypt, "16 نوفمبر 2026" (FR-022 criterion 3). */
    months: {
      jan: 'يناير',
      feb: 'فبراير',
      mar: 'مارس',
      apr: 'أبريل',
      may: 'مايو',
      jun: 'يونيو',
      jul: 'يوليو',
      aug: 'أغسطس',
      sep: 'سبتمبر',
      oct: 'أكتوبر',
      nov: 'نوفمبر',
      dec: 'ديسمبر',
    },
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
  policy: {
    draftTitle: 'مسودة للمراجعة',
    draftBody:
      'هذه الصفحة مسودة كتبها الفريق الذي يطوّر مصاريف لوصف طريقة عمل الخدمة. وهي ليست نصًا قانونيًا، ولا تزال بانتظار المراجعة القانونية.',
    version: 'رقم الإصدار',
    effectiveDate: 'تاريخ السريان',
    notAvailable: 'هذه الوثيقة غير متاحة باللغة العربية بعد.',
    contactPending: 'سيُنشر عنوان التواصل هنا.',
    pendingLabel: 'يُضاف بعد المراجعة القانونية',
  },
  policyNotice: {
    title: 'تم تحديث الوثائق',
    body: 'نُشر إصدار جديد مما يلي، يُرجى الاطلاع عليه:',
    dismiss: 'إغلاق',
  },
} as const satisfies Translation;
