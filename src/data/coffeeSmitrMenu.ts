export type FoodCategory = 'Panini & Bun' | 'Wrap' | 'Cake';
export type DrinkCategory = 'Coffee' | 'Tea & Non-Coffee' | 'Milk & Soda';

export interface FoodMenuItem {
  id: string;
  category: FoodCategory;
  nameEn: string;
  nameTh: string;
  price: number;
  description: string;
  tags?: string[];
}

export interface DrinkMenuItem {
  id: string;
  category: DrinkCategory;
  name: string;
  nameTh: string;
  icePrice: number | null;
  hotPrice: number | null;
  tags?: string[];
}

export interface DrinkAddon {
  id: string;
  label: string;
  price: number;
}

export const BUDGET_LIMIT_BAHT = 150;

export const FOOD_MENU_ITEMS: FoodMenuItem[] = [
  // Panini & Bun
  {
    id: 'food-ham-cheese-panini',
    category: 'Panini & Bun',
    nameEn: 'HAM CHEESE PANINI',
    nameTh: 'พานีนี แฮมชีส',
    price: 65,
    description: 'บันแป้งสาลีไม่ขัดสีหอมเนย ทามายองเนสคิวพี ไส้แฮมชีส เสิร์ฟหนีบร้อนจนชีสละลาย',
  },
  {
    id: 'food-truffle-ham-cheese-panini',
    category: 'Panini & Bun',
    nameEn: 'TRUFFLE HAM CHEESE PANINI',
    nameTh: 'พานีนี ทรัฟเฟิล แฮมชีส',
    price: 70,
    description: 'อร่อยแบบพรีเมียม ด้วยทรัฟเฟิลมาโยหอมฟุ้ง เข้ากันได้ดีกับความเค็มมันของแฮมชีส',
  },
  {
    id: 'food-ham-spinach-panini',
    category: 'Panini & Bun',
    nameEn: 'HAM & SPINACH PANINI',
    nameTh: 'พานีนี แฮม ผักโขมอบชีส',
    price: 75,
    description: 'หอมอร่อยรสกลมกล่อมแฮม และผักโขมอบชีส เสิร์ฟหนีบร้อนจนชีสเยิ้ม',
  },
  {
    id: 'food-chicken-egg-salad-panini',
    category: 'Panini & Bun',
    nameEn: 'CHICKEN & EGG SALAD PANINI',
    nameTh: 'พานีนี อกไก่รมควัน สลัดไข่',
    price: 65,
    description: 'อกไก่รมควันเนื้อนุ่ม และความละมุนของสลัดไข่มาโยที่เข้ากันอย่างลงตัว เสิร์ฟหนีบร้อน',
  },
  {
    id: 'food-hamburg-panini',
    category: 'Panini & Bun',
    nameEn: 'HAMBURG PANINI',
    nameTh: 'พานีนี แฮมเบิร์ก (เนื้อ+หมู)',
    price: 75,
    description: 'เนื้อแฮมเบิร์กสูตรคอฟฟี่สมิตร ทาวูสเตอร์ซอส หวานกลมกล่อมจากแยมหัวหอม และชีสเยิ้ม',
  },
  {
    id: 'food-melted-me-tuna-panini',
    category: 'Panini & Bun',
    nameEn: 'MELTED ME TUNA PANINI',
    nameTh: 'พานีนี ทูน่าชีส',
    price: 65,
    description: 'บันแป้งสาลีไม่ขัดสีหอมเนย ไส้ทูน่าผสมมายองเนสคิวพีรสกลมกล่อม พร้อมชีสเยิ้ม',
  },
  {
    id: 'food-salmon-creamcheese-panini',
    category: 'Panini & Bun',
    nameEn: 'SALMON CREAMCHEESE PANINI',
    nameTh: 'พานีนี แซลมอน ครีมชีส',
    price: 70,
    description: 'บันมันเผาเนื้อนุ่มหนึบ ไส้แซลมอนครีมชีส และต้นหอม เสิร์ฟหนีบร้อน',
  },
  {
    id: 'food-sweet-potato-almond',
    category: 'Panini & Bun',
    nameEn: 'SWEET POTATO ALMOND',
    nameTh: 'พานีนี มันเผา อัลมอนด์',
    price: 60,
    description: 'บันมันเผาเนื้อนุ่มหนึบ ไส้มันหวานญี่ปุ่นเนื้อเนียน และโรยอัลมอนด์สไลซ์ เสิร์ฟหนีบร้อนหอมมันเผา',
    tags: ['มังสวิรัติ'],
  },
  {
    id: 'food-mentaiko-cream-cheese',
    category: 'Panini & Bun',
    nameEn: 'MENTAIKO CREAM CHEESE',
    nameTh: 'พานีนี เมนไทโกะครีมชีส',
    price: 70,
    description: 'บันมันเผาเนื้อนุ่มหนึบ ผสานความเค็มมันอูมามิ จากไข่ปลาเมนไทโกะครีมชีส และต้นหอมซอย',
  },
  {
    id: 'food-almond-butter-panini',
    category: 'Panini & Bun',
    nameEn: 'ALMOND BUTTER PANINI',
    nameTh: 'พานีนี เนยอัลมอนด์',
    price: 65,
    description: 'เมนูสำหรับสายหวานที่รักสุขภาพ ไส้เนยอัลมอนด์ 100% เคี้ยวกรุบเนื้ออัลมอนด์ เสิร์ฟหนีบร้อน',
    tags: ['สุขภาพ', 'มังสวิรัติ'],
  },
  {
    id: 'food-spinach-cheesy-bun',
    category: 'Panini & Bun',
    nameEn: 'SPINACH CHEESY BUN',
    nameTh: 'บันผักโขมอบชีส',
    price: 65,
    description: 'บันเนื้อนุ่ม มาพร้อมไส้ผักโขมอบชีสแน่นๆ อบสดใหม่หอมกรุ่น',
    tags: ['มังสวิรัติ'],
  },
  {
    id: 'food-truffle-cheesy-bun',
    category: 'Panini & Bun',
    nameEn: 'TRUFFLE CHEESY BUN',
    nameTh: 'บันชีสทรัฟเฟิล',
    price: 65,
    description: 'บันเนื้อนุ่ม หอมฟุ้งซอสทรัฟเฟิลพรีเมียม พร้อมไส้เชดด้า มอสซาเรลล่า ชีสแน่นๆ หอมหวานมันเค็ม',
    tags: ['มังสวิรัติ'],
  },

  // Wrap
  {
    id: 'food-cheesy-spinach-chicken-wrap',
    category: 'Wrap',
    nameEn: 'CHEESY SPINACH & CHICKEN',
    nameTh: 'แร็ป ผักโขมอบชีสไก่',
    price: 78,
    description: 'ผักโขมอบชีส ไก่ และไข่ต้ม อิ่มอร่อยในแผ่นแป้งตอติญ่า',
  },
  {
    id: 'food-bacon-n-egg-wrap',
    category: 'Wrap',
    nameEn: 'BACON N EGG WRAP',
    nameTh: 'แร็ป ไข่เบคอน',
    price: 78,
    description: 'ไข่สแครมเบิ้ลเนื้อนุ่มหอมเนย เบคอน ชีส และซอสมะเขือเทศ รสกลมกล่อมในแผ่นแป้งตอติญ่า',
  },
  {
    id: 'food-caesar-chicken-wrap',
    category: 'Wrap',
    nameEn: 'CAESAR CHICKEN WRAP',
    nameTh: 'แร็ปซีซาร์สลัดไก่',
    price: 88,
    description: 'แผ่นแป้งตอติญ่าโฮลวีทห่อซีซาร์สลัดผักคอส สันในไก่ เบคอนกรอบ และพาเมซานชีส',
  },
  {
    id: 'food-beef-n-cheese-wrap',
    category: 'Wrap',
    nameEn: 'BEEF N CHEESE WRAP',
    nameTh: 'แร็ปเนื้อ และชีส',
    price: 88,
    description: 'เนื้อผัดหอมเครื่องเทศเบาๆ ผักคอส มะเขือเทศอบแห้ง ชีส และทาทาร์ซอส ในแผ่นแป้งตอติญ่าร้อนๆ',
  },
  {
    id: 'food-bolonese-pork-ball',
    category: 'Wrap',
    nameEn: 'BOLONESE PORK BALL',
    nameTh: 'แร็ปพอร์คบอลโบโลเนส',
    price: 88,
    description: 'พอร์คบอลโฮมเมด พร้อมซอสโบโลเนสเข้มข้น และชีส ในแผ่นแป้งตอติญ่าหนีบร้อน',
  },
  {
    id: 'food-banana-almond-butter-wrap',
    category: 'Wrap',
    nameEn: 'BANANA & ALMOND BUTTER',
    nameTh: 'แร็ปกล้วยเนยอัลมอนด์',
    price: 78,
    description: 'เมนูสำหรับสายหวานที่รักสุขภาพ แผ่นแป้งตอติญ่าห่อกล้วยหอม เนยอัลมอนด์ และโกโก้นิบส์',
    tags: ['สุขภาพ', 'มังสวิรัติ'],
  },

  // Cake
  {
    id: 'food-fudgy-brownie',
    category: 'Cake',
    nameEn: 'FUDGY BROWNIE',
    nameTh: 'บราวนี่ ดาร์กช็อกโกแลต',
    price: 68,
    description: 'บราวนี่เนื้อนุ่มหนึบช็อกโกแลตเข้มข้นเอสเพรสโซ่ และโรยหน้าช็อกโกแลตชิป',
  },
  {
    id: 'food-matcha-mochi-brownie',
    category: 'Cake',
    nameEn: 'MATCHA MOCHI BROWNIE',
    nameTh: 'บราวนี่มัทฉะโมจิ',
    price: 68,
    description: 'บราวนี่มัทฉะ เนื้อนุ่มหนึบรสหอมกลมกล่อม และโรยหน้าไวท์ช็อกโกแลตชิป',
  },
  {
    id: 'food-coffee-banana-crumble',
    category: 'Cake',
    nameEn: 'COFFEE BANANA CRUMBLE',
    nameTh: 'เค้กกล้วยคอฟฟี่ ครัมเบิ้ล',
    price: 65,
    description: 'เค้กเนื้อนุ่มหอมกล้วย กลมกล่อมรสเข้มข้นกาแฟ และโรยหน้าด้วยครัมเบิ้ลหอมเนยกาแฟ',
  },
  {
    id: 'food-strawberry-cheesecake-crumble',
    category: 'Cake',
    nameEn: 'STRAWBERRY CHEESECAKE CRUMBLE',
    nameTh: 'สตอเบอรี่ชีสเค้กครัมเบิ้ล',
    price: 70,
    description: 'ชีสเค้กเนื้อนุ่มรสกลมกล่อม หอมหวานสตอเบอรี่ และโรยหน้าด้วยครัมเบิ้ลหอมเนย',
  },
  {
    id: 'food-banana-tatin',
    category: 'Cake',
    nameEn: 'BANANA TATIN',
    nameTh: 'เค้กกล้วยตาแตง',
    price: 60,
    description: 'เค้กกล้วยหอมคาราเมล เนื้อฉ่ำนุ่ม อัดแน่นด้วยเนื้อกล้วยหอมเน้นๆ หอมหวานรสละมุน',
  },
  {
    id: 'food-nanas-no-worries',
    category: 'Cake',
    nameEn: 'NANA’S “NO-WORRIES”',
    nameTh: 'บาร์โอ๊ตกล้วย นาน่า',
    price: 65,
    description: 'โอ๊ต กล้วย เนยอัลมอนด์ และความหวานจากน้ำผึ้ง (ปราศจากนมวัว ไข่ และกลูเตน)',
    tags: ['Dairy-free', 'Egg-free', 'Gluten-free'],
  },
];

export const DRINK_MENU_ITEMS: DrinkMenuItem[] = [
  // COFFEE
  { id: 'drink-espresso', category: 'Coffee', name: 'Espresso (Single Shot)', nameTh: 'เอสเพรสโซ่ (ซิงเกิลช็อต)', icePrice: null, hotPrice: 50 },
  { id: 'drink-americano', category: 'Coffee', name: 'Americano', nameTh: 'อเมริกาโน่', icePrice: 50, hotPrice: 50 },
  { id: 'drink-americano-honey', category: 'Coffee', name: 'Americano x Honey', nameTh: 'อเมริกาโน่ น้ำผึ้ง', icePrice: 65, hotPrice: 65 },
  { id: 'drink-americano-orange', category: 'Coffee', name: 'Americano x Orange Juice', nameTh: 'อเมริกาโน่ น้ำส้ม', icePrice: 75, hotPrice: null },
  { id: 'drink-americano-apple', category: 'Coffee', name: 'Americano x Apple Juice', nameTh: 'อเมริกาโน่ น้ำแอปเปิล', icePrice: 85, hotPrice: null },
  { id: 'drink-americano-yuzu', category: 'Coffee', name: 'Americano x Yuzu Soda', nameTh: 'อเมริกาโน่ ยูซุโซดา', icePrice: 75, hotPrice: null },
  { id: 'drink-americano-lemon', category: 'Coffee', name: 'Americano x Lemon Soda', nameTh: 'อเมริกาโน่ เลมอนโซดา', icePrice: 75, hotPrice: null },
  { id: 'drink-americano-honeylemon', category: 'Coffee', name: 'Americano x Honey Lemon', nameTh: 'อเมริกาโน่ น้ำผึ้งมะนาว', icePrice: 80, hotPrice: null },
  { id: 'drink-latte', category: 'Coffee', name: 'Latte', nameTh: 'ลาเต้', icePrice: 60, hotPrice: 60 },
  { id: 'drink-piccolo-latte', category: 'Coffee', name: 'Piccolo Latte', nameTh: 'พิคโคโล่ ลาเต้', icePrice: null, hotPrice: 60 },
  { id: 'drink-es-yen', category: 'Coffee', name: 'Es Yen (Thai style milk coffee)', nameTh: 'เอสเย็น (กาแฟเย็นสไตล์ไทย)', icePrice: 60, hotPrice: null },
  { id: 'drink-cappuccino', category: 'Coffee', name: 'Cappuccino', nameTh: 'คาปูชิโน่', icePrice: 60, hotPrice: 60 },
  { id: 'drink-mocha', category: 'Coffee', name: 'Mocha', nameTh: 'มอคค่า', icePrice: 70, hotPrice: 65 },
  { id: 'drink-mocha-mint', category: 'Coffee', name: 'Mocha x Mint', nameTh: 'มอคค่า มิ้นท์', icePrice: 75, hotPrice: null },
  { id: 'drink-mocha-strawberry', category: 'Coffee', name: 'Mocha x Strawberry', nameTh: 'มอคค่า สตรอว์เบอร์รี', icePrice: 85, hotPrice: null },
  { id: 'drink-latte-caramel', category: 'Coffee', name: 'Latte x Caramel', nameTh: 'คาราเมล ลาเต้', icePrice: 65, hotPrice: 65 },
  { id: 'drink-latte-mint', category: 'Coffee', name: 'Latte x Mint', nameTh: 'มิ้นท์ ลาเต้', icePrice: 65, hotPrice: null },
  { id: 'drink-espresso-matcha', category: 'Coffee', name: 'Espresso x Matcha', nameTh: 'เอสเพรสโซ่ มัทฉะ', icePrice: 85, hotPrice: null },
  { id: 'drink-espresso-thaitea', category: 'Coffee', name: 'Espresso x Thai Tea', nameTh: 'เอสเพรสโซ่ ชาไทย', icePrice: 75, hotPrice: null },
  { id: 'drink-oat-milk-latte', category: 'Coffee', name: 'Oat Milk Latte', nameTh: 'โอ๊ตมิลค์ ลาเต้', icePrice: 70, hotPrice: null, tags: ['Lactose-Free'] },

  // TEA & NON-COFFEE
  { id: 'drink-thai-tea', category: 'Tea & Non-Coffee', name: 'Thai Tea Latte', nameTh: 'ชาไทย ลาเต้', icePrice: 55, hotPrice: null },
  { id: 'drink-oat-milk-thai-tea', category: 'Tea & Non-Coffee', name: 'Oat Milk Thai Tea', nameTh: 'ชาไทย นมโอ๊ต', icePrice: 65, hotPrice: null, tags: ['Lactose-Free'] },
  { id: 'drink-matcha-uji', category: 'Tea & Non-Coffee', name: 'Matcha Latte (UJI)', nameTh: 'มัทฉะ ลาเต้ (อูจิ)', icePrice: 75, hotPrice: 75 },
  { id: 'drink-hojicha-latte', category: 'Tea & Non-Coffee', name: 'Hojicha Latte', nameTh: 'โฮจิฉะ ลาเต้', icePrice: 75, hotPrice: 75 },
  { id: 'drink-matcha-yuzu', category: 'Tea & Non-Coffee', name: 'Matcha (UJI) x Yuzu', nameTh: 'มัทฉะ ยูซุ', icePrice: 85, hotPrice: null },
  { id: 'drink-matcha-orange', category: 'Tea & Non-Coffee', name: 'Matcha (UJI) x Orange Juice', nameTh: 'มัทฉะ น้ำส้ม', icePrice: 85, hotPrice: null },
  { id: 'drink-matcha-apple', category: 'Tea & Non-Coffee', name: 'Matcha (UJI) x Apple Juice', nameTh: 'มัทฉะ น้ำแอปเปิล', icePrice: 90, hotPrice: null },
  { id: 'drink-matcha-strawberry', category: 'Tea & Non-Coffee', name: 'Matcha (UJI) x Strawberry', nameTh: 'มัทฉะ สตรอว์เบอร์รี', icePrice: 85, hotPrice: null },
  { id: 'drink-pure-uji-matcha', category: 'Tea & Non-Coffee', name: 'Pure UJI Matcha (no milk)', nameTh: 'เพียวมัทฉะอูจิ (ไม่ใส่นม)', icePrice: 75, hotPrice: 75 },
  { id: 'drink-chocolate', category: 'Tea & Non-Coffee', name: 'Chocolate', nameTh: 'ช็อกโกแลต', icePrice: 65, hotPrice: 65 },
  { id: 'drink-chocolate-thaitea', category: 'Tea & Non-Coffee', name: 'Chocolate x Thai Tea Latte', nameTh: 'ช็อกโกแลต ชาไทย', icePrice: 70, hotPrice: null },
  { id: 'drink-chocolate-orange', category: 'Tea & Non-Coffee', name: 'Chocolate x Orange Juice', nameTh: 'ช็อกโกแลต น้ำส้ม', icePrice: 75, hotPrice: null },
  { id: 'drink-chocolate-mint', category: 'Tea & Non-Coffee', name: 'Chocolate x Mint', nameTh: 'ช็อกโกแลต มิ้นท์', icePrice: 75, hotPrice: null },
  { id: 'drink-chocolate-strawberry', category: 'Tea & Non-Coffee', name: 'Chocolate x Strawberry', nameTh: 'ช็อกโกแลต สตรอว์เบอร์รี', icePrice: 80, hotPrice: null },

  // MILK & SODA
  { id: 'drink-strawberry-milk', category: 'Milk & Soda', name: 'Strawberry Milk', nameTh: 'นมสตรอว์เบอร์รี', icePrice: 70, hotPrice: null },
  { id: 'drink-caramel-milk', category: 'Milk & Soda', name: 'Caramel Milk', nameTh: 'นมคาราเมล', icePrice: 65, hotPrice: null },
  { id: 'drink-mint-milk', category: 'Milk & Soda', name: 'Mint Milk', nameTh: 'นมมิ้นท์', icePrice: 65, hotPrice: null },
  { id: 'drink-honey-milk', category: 'Milk & Soda', name: 'Honey Milk', nameTh: 'นมน้ำผึ้ง', icePrice: 65, hotPrice: null },
  { id: 'drink-strawberry-soda', category: 'Milk & Soda', name: 'Strawberry Soda', nameTh: 'สตรอว์เบอร์รีโซดา', icePrice: 65, hotPrice: null },
  { id: 'drink-yuzu-soda', category: 'Milk & Soda', name: 'Yuzu Soda', nameTh: 'ยูซุโซดา', icePrice: 70, hotPrice: null },
  { id: 'drink-lemon-soda', category: 'Milk & Soda', name: 'Lemon Soda', nameTh: 'เลมอนโซดา', icePrice: 65, hotPrice: null },
  { id: 'drink-honey-lemon-soda', category: 'Milk & Soda', name: 'Honey Lemon Soda', nameTh: 'น้ำผึ้งมะนาวโซดา', icePrice: 70, hotPrice: null },
  { id: 'drink-granny-smith-apple', category: 'Milk & Soda', name: 'Granny Smith Apple Juice', nameTh: 'น้ำแอปเปิลเขียวแกรนนี่สมิธ', icePrice: 65, hotPrice: null },
];

export const DRINK_ADDONS: DrinkAddon[] = [
  { id: 'addon-espresso', label: 'เพิ่ม Espresso Shot', price: 20 },
  { id: 'addon-oatmilk', label: 'เปลี่ยนเป็น Oat Milk', price: 10 },
  { id: 'addon-honey', label: 'เพิ่ม Honey', price: 15 },
];

export function getMinDrinkPrice(drink: DrinkMenuItem): number {
  const prices = [drink.icePrice, drink.hotPrice].filter((p): p is number => p !== null);
  return prices.length > 0 ? Math.min(...prices) : 0;
}
