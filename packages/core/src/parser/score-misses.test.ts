import { describe, expect, it } from 'vitest';

import { parseUtterance, toMinor, type CurrencyCode } from '../index.js';

/**
 * Every sentence the typed-transcript score missed before T-007a, with the values the voice
 * test set expects (copied from poc/voice/manifests, which are never edited to fit the parser).
 */
type Row = readonly [
  id: string,
  text: string,
  amount: string,
  currency: CurrencyCode,
  category: string,
  date: string,
];

const TODAY = '2026-11-16';
const parse = (text: string) =>
  parseUtterance(text, { language: 'ar', defaultCurrency: 'EGP', today: TODAY });

const FIXED: readonly Row[] = [
  ['ar-008', 'شحنت كارت فودافون بخمسين جنيه', '50.00', 'EGP', 'bills_utilities', '2026-11-16'],
  [
    'ar-015',
    'اشتريت كيس سكر وزيت بخمسة وتمانين جنيه ونص',
    '85.50',
    'EGP',
    'groceries',
    '2026-11-16',
  ],
  [
    'ar-023',
    'يوم الجمعة اللي فات اتغدينا برة بستمية جنيه',
    '600.00',
    'EGP',
    'food_drink',
    '2026-11-13',
  ],
  ['ar-025', '٢٥٠ جنيه نت البيت', '250.00', 'EGP', 'bills_utilities', '2026-11-16'],
  ['ar-027', 'اشتريت تيشيرت ب 300 جنيه', '300.00', 'EGP', 'shopping', '2026-11-16'],
  ['ar-032', 'خلصت ميت درهم في المول', '100.00', 'AED', 'shopping', '2026-11-16'],
  ['ar-037', 'اتعشيت سمك بمتين وخمسين جنيه', '250.00', 'EGP', 'food_drink', '2026-11-16'],
  ['ar-038', 'جبت كيلو لحمة بأربعمية وخمسين جنيه', '450.00', 'EGP', 'groceries', '2026-11-16'],
  ['ar-039', 'اشتريت تلاتة سندوتشات بستين جنيه', '60.00', 'EGP', 'food_drink', '2026-11-16'],
  ['ar-046', 'اشتريت شاحن للموبايل بمية وخمسين جنيه', '150.00', 'EGP', 'shopping', '2026-11-16'],
  ['ar-050', 'ركنت العربية بعشرين جنيه', '20.00', 'EGP', 'transport', '2026-11-16'],
  ['ar-051', 'غيرت زيت العربية بتمنمية جنيه', '800.00', 'EGP', 'transport', '2026-11-16'],
  [
    'ar-060',
    'من خمس ايام اشتريت ساعة بألف وتمنمية جنيه',
    '1800.00',
    'EGP',
    'shopping',
    '2026-11-11',
  ],
  [
    'ar-062',
    'يوم الخميس اللي فات روحت الملاهي بتلتمية جنيه',
    '300.00',
    'EGP',
    'entertainment',
    '2026-11-12',
  ],
  ['ar-069', 'نص كيلو جبنة بخمسة وتمانين جنيه', '85.00', 'EGP', 'groceries', '2026-11-16'],
  ['ar-070', 'ربع كيلو بن بمية وعشرين جنيه', '120.00', 'EGP', 'groceries', '2026-11-16'],
  [
    'ar-074',
    'تذكرة القطر لإسكندرية بمية وتلاتة وعشرين جنيه ونص',
    '123.50',
    'EGP',
    'transport',
    '2026-11-16',
  ],
  ['ar-075', 'تمن الروشتة تلتمية وخمسة وتسعين جنيه وربع', '395.25', 'EGP', 'health', '2026-11-16'],
  ['ar-076', 'الركنة بعشرة جنيه إلا ربع', '9.75', 'EGP', 'transport', '2026-11-16'],
  [
    'ar-077',
    'فاتورة المية تسعة وأربعين جنيه وخمسة وعشرين قرش',
    '49.25',
    'EGP',
    'bills_utilities',
    '2026-11-16',
  ],
  ['ar-078', 'اشتريت سماعة بألف ونص جنيه', '1500.00', 'EGP', 'shopping', '2026-11-16'],
  ['ar-079', 'دفعت 37.5 جنيه في الكافيتريا', '37.50', 'EGP', 'food_drink', '2026-11-16'],
  ['ar-080', 'خمسة جنيه وخمسين عيش فينو', '5.50', 'EGP', 'groceries', '2026-11-16'],
  [
    'ar-081',
    'اشتريت تلاتة كيلو طماطم بخمسة وأربعين جنيه',
    '45.00',
    'EGP',
    'groceries',
    '2026-11-16',
  ],
  ['ar-082', 'اتنين كيلو برتقان بخمسين جنيه', '50.00', 'EGP', 'groceries', '2026-11-16'],
  ['ar-084', 'دفعت 3 شهور نت ب 750 جنيه', '750.00', 'EGP', 'bills_utilities', '2026-11-16'],
  [
    'ar-085',
    'تلات تذاكر سينما كل واحدة بميتين جنيه',
    '600.00',
    'EGP',
    'entertainment',
    '2026-11-16',
  ],
  [
    'ar-086',
    'في الساعة تمانية بالليل اتعشيت بمتين جنيه',
    '200.00',
    'EGP',
    'food_drink',
    '2026-11-16',
  ],
  ['ar-096', 'قبل ثلاثة أيام اشتريت دواء بمائتي جنيه', '200.00', 'EGP', 'health', '2026-11-13'],
  ['ar-102', 'اشتريت charger للـ laptop بستمية جنيه', '600.00', 'EGP', 'shopping', '2026-11-16'],
  ['ar-109', 'دفعت الـ rent بتاع الشقة خمستلاف جنيه', '5000.00', 'EGP', 'housing', '2026-11-16'],
  ['en-017', 'phone credit top up 100 pounds', '100.00', 'EGP', 'bills_utilities', '2026-11-16'],
  ['en-021', 'bought a charger for 150 pounds', '150.00', 'EGP', 'shopping', '2026-11-16'],
  ['en-023', 'last Friday we ate out for 600 pounds', '600.00', 'EGP', 'food_drink', '2026-11-13'],
  ['en-028', 'a hundred euros for a handbag', '100.00', 'EUR', 'shopping', '2026-11-16'],
  ['en-033', '12 pounds 50 for a sandwich', '12.50', 'EGP', 'food_drink', '2026-11-16'],
  ['en-036', 'a kilo of meat for 450 pounds', '450.00', 'EGP', 'groceries', '2026-11-16'],
  ['en-037', 'three sandwiches for sixty pounds', '60.00', 'EGP', 'food_drink', '2026-11-16'],
  ['en-039', 'tuk tuk ride 30 pounds', '30.00', 'EGP', 'transport', '2026-11-16'],
  ['en-043', 'parked the car for twenty pounds', '20.00', 'EGP', 'transport', '2026-11-16'],
  ['en-044', 'oil change 800 pounds', '800.00', 'EGP', 'transport', '2026-11-16'],
  ['en-046', 'football match ticket 200 pounds', '200.00', 'EGP', 'entertainment', '2026-11-16'],
  ['en-051', 'five days ago I bought a watch for 1800', '1800.00', 'EGP', 'shopping', '2026-11-11'],
  [
    'en-053',
    'last Thursday amusement park 300 pounds',
    '300.00',
    'EGP',
    'entertainment',
    '2026-11-12',
  ],
  ['en-060', 'half a kilo of cheese for 85 pounds', '85.00', 'EGP', 'groceries', '2026-11-16'],
  ['en-061', 'a quarter kilo of coffee beans 120', '120.00', 'EGP', 'groceries', '2026-11-16'],
  [
    'en-064',
    'prescription cost 395 pounds and 25 piastres',
    '395.25',
    'EGP',
    'health',
    '2026-11-16',
  ],
  [
    'en-066',
    'headphones for one and a half thousand pounds',
    '1500.00',
    'EGP',
    'shopping',
    '2026-11-16',
  ],
  ['en-073', 'gas cylinder 150 pounds', '150.00', 'EGP', 'bills_utilities', '2026-11-16'],
  ['en-078', 'Starbucks latte 140', '140.00', 'EGP', 'food_drink', '2026-11-16'],
  ['en-080', 'bus ticket three pounds fifty', '3.50', 'EGP', 'transport', '2026-11-16'],
  [
    'en-081',
    'bought a laptop for twenty five thousand pounds',
    '25000.00',
    'EGP',
    'shopping',
    '2026-11-16',
  ],
  ['en-082', 'paid the nursery fees 3000', '3000.00', 'EGP', 'education', '2026-11-16'],
  ['en-083', 'three movie tickets at 200 each', '600.00', 'EGP', 'entertainment', '2026-11-16'],
  ['en-084', '2 pizzas for 400', '400.00', 'EGP', 'food_drink', '2026-11-16'],
  ['en-085', 'paid 3 months of internet, 750', '750.00', 'EGP', 'bills_utilities', '2026-11-16'],
  ['en-087', 'bought 3 kilos of tomatoes for 45 pounds', '45.00', 'EGP', 'groceries', '2026-11-16'],
  ['en-088', 'two kilos of oranges for fifty', '50.00', 'EGP', 'groceries', '2026-11-16'],
  [
    'en-095',
    'bought sugar and oil for eighty five pounds fifty',
    '85.50',
    'EGP',
    'groceries',
    '2026-11-16',
  ],
  ['en-096', 'lunch for $15', '15.00', 'USD', 'food_drink', '2026-11-16'],
  ['en-097', 'paid €40 for a museum ticket', '40.00', 'EUR', 'entertainment', '2026-11-16'],
  [
    'en-099',
    'bought textbooks for six hundred and forty pounds',
    '640.00',
    'EGP',
    'education',
    '2026-11-16',
  ],
  [
    'en-101',
    'thirty days ago bought a winter coat for 2200',
    '2200.00',
    'EGP',
    'shopping',
    '2026-10-17',
  ],
  [
    'en-102',
    'four days ago got my eyes tested for 250 pounds',
    '250.00',
    'EGP',
    'health',
    '2026-11-12',
  ],
  [
    'en-103',
    'six days ago paid for a cooking class, 700',
    '700.00',
    'EGP',
    'education',
    '2026-11-10',
  ],
  [
    'en-106',
    'renewed my phone plan for two hundred and ten pounds',
    '210.00',
    'EGP',
    'bills_utilities',
    '2026-11-16',
  ],
  ['en-107', 'the gas station took six hundred pounds', '600.00', 'EGP', 'transport', '2026-11-16'],
  ['en-110', 'koshary for thirty five pounds', '35.00', 'EGP', 'food_drink', '2026-11-16'],
  [
    'en-114',
    'last Monday I bought a phone case for 175 pounds',
    '175.00',
    'EGP',
    'shopping',
    '2026-11-09',
  ],
];

/** Their dates are outside the FR-027 list, so RA-25 keeps them on today, flagged. */
const BLOCKED_BY_FR_027: readonly Row[] = [
  ['ar-061', 'من أسبوع دفعت للمدرس خمسمية جنيه', '500.00', 'EGP', 'education', '2026-11-09'],
  ['en-048', "last night's taxi was sixty pounds", '60.00', 'EGP', 'transport', '2026-11-15'],
  ['en-052', 'a week ago I paid the tutor 500 pounds', '500.00', 'EGP', 'education', '2026-11-09'],
  [
    'en-100',
    'paid the electricity bill on Friday, 400 pounds',
    '400.00',
    'EGP',
    'bills_utilities',
    '2026-11-13',
  ],
  [
    'en-109',
    'cab home last night two hundred and twenty pounds',
    '220.00',
    'EGP',
    'transport',
    '2026-11-15',
  ],
];

const minor = (amount: string | undefined, currency: CurrencyCode) =>
  toMinor(amount ?? '', currency);

describe('sentences the typed-transcript score missed (T-007a)', () => {
  for (const [id, text, amount, currency, category, date] of FIXED) {
    it(`${id}: ${text}`, () => {
      const result = parse(text);
      expect(minor(result.amount, result.currency)).toEqual(minor(amount, currency));
      expect(result.currency).toBe(currency);
      expect(result.category).toBe(category);
      expect(result.date).toBe(date);
    });
  }
});

describe('date expressions outside FR-027 stay on today, flagged (RA-25)', () => {
  for (const [id, text, amount, currency, category] of BLOCKED_BY_FR_027) {
    it(`${id}: ${text}`, () => {
      const result = parse(text);
      expect(minor(result.amount, result.currency)).toEqual(minor(amount, currency));
      expect(result.category).toBe(category);
      expect(result.date).toBe(TODAY);
      expect(result.attention.date).toBe(true);
    });
  }
});
