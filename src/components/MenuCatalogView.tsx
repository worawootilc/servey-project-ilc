import { useMemo, useState } from 'react';
import { ArrowRight, Check, Coffee, Search, Sparkles, Utensils } from 'lucide-react';
import {
  BUDGET_LIMIT_BAHT,
  DRINK_ADDONS,
  DRINK_MENU_ITEMS,
  FOOD_MENU_ITEMS,
  getMinDrinkPrice,
  type DrinkCategory,
  type DrinkMenuItem,
  type FoodCategory,
  type FoodMenuItem,
} from '../data/coffeeSmitrMenu.ts';
import type { MenuComboSelection } from '../types/survey.ts';

interface MenuCatalogViewProps {
  onApplyToSurvey: (partialCombo: Partial<MenuComboSelection>) => void;
}

export function MenuCatalogView({ onApplyToSurvey }: MenuCatalogViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'drink' | 'combos'>('combos');
  const [search, setSearch] = useState('');
  const [selectedFoodFilter, setSelectedFoodFilter] = useState<'ALL' | FoodCategory>('ALL');
  const [selectedDrinkFilter, setSelectedDrinkFilter] = useState<'ALL' | DrinkCategory>('ALL');
  const [maxItemPrice, setMaxItemPrice] = useState<number>(90);

  // Pair explorer state
  const [pairFood, setPairFood] = useState<FoodMenuItem | null>(FOOD_MENU_ITEMS[1]);
  const [pairDrink, setPairDrink] = useState<DrinkMenuItem | null>(DRINK_MENU_ITEMS[22]);

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FOOD_MENU_ITEMS.filter((item) => {
      if (selectedFoodFilter !== 'ALL' && item.category !== selectedFoodFilter) return false;
      if (item.price > maxItemPrice) return false;
      if (!q) return true;
      return (
        item.nameEn.toLowerCase().includes(q) ||
        item.nameTh.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [search, selectedFoodFilter, maxItemPrice]);

  const filteredDrinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DRINK_MENU_ITEMS.filter((item) => {
      if (selectedDrinkFilter !== 'ALL' && item.category !== selectedDrinkFilter) return false;
      if (getMinDrinkPrice(item) > maxItemPrice) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.nameTh.toLowerCase().includes(q);
    });
  }, [search, selectedDrinkFilter, maxItemPrice]);

  // Pre-computed curated 150 THB combos across all price tiers
  const curatedCombos = useMemo(() => {
    const pairs: Array<{
      title: string;
      tag: string;
      food: FoodMenuItem;
      drink: DrinkMenuItem;
      temp: 'ICE' | 'HOT';
      total: number;
    }> = [
      {
        title: 'เซตทรัฟเฟิลแฮมชีส + มัทฉะอูจิ',
        tag: 'แนะนำ · พอดีงบ',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-truffle-ham-cheese-panini')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-matcha-uji')!,
        temp: 'ICE',
        total: 145,
      },
      {
        title: 'เซตซีซาร์แร็ป + ลาเต้เย็น',
        tag: 'อิ่มคุ้มที่สุด',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-caesar-chicken-wrap')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-latte')!,
        temp: 'ICE',
        total: 148,
      },
      {
        title: 'เซตพานีนีแฮมชีส + อเมริกาโน่น้ำส้ม',
        tag: 'กาแฟผลไม้สดชื่น',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-ham-cheese-panini')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-americano-orange')!,
        temp: 'ICE',
        total: 140,
      },
      {
        title: 'เซตเค้กกล้วยตาแตง + มัทฉะยูซุ',
        tag: 'สายขนม & มัทฉะ',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-banana-tatin')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-matcha-yuzu')!,
        temp: 'ICE',
        total: 145,
      },
      {
        title: 'เซตพานีนีมันเผาอัลมอนด์ + มัทฉะแอปเปิล',
        tag: 'จัดเมนูพรีเมียม 90฿',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-sweet-potato-almond')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-matcha-apple')!,
        temp: 'ICE',
        total: 150,
      },
      {
        title: 'เซตบราวนี่ดาร์กช็อก + ยูซุโซดา',
        tag: 'พักเบรกช่วงบ่าย',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-fudgy-brownie')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-yuzu-soda')!,
        temp: 'ICE',
        total: 138,
      },
      {
        title: 'เซตแซลมอนครีมชีส + เอสเย็น',
        tag: 'รสเข้มข้นกลมกล่อม',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-salmon-creamcheese-panini')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-es-yen')!,
        temp: 'ICE',
        total: 130,
      },
      {
        title: 'เซตปราศจากนมวัว & กลูเตน',
        tag: 'Dairy / Gluten Free',
        food: FOOD_MENU_ITEMS.find((f) => f.id === 'food-nanas-no-worries')!,
        drink: DRINK_MENU_ITEMS.find((d) => d.id === 'drink-oat-milk-latte')!,
        temp: 'ICE',
        total: 135,
      },
    ];
    return pairs.filter((p) => p.food && p.drink);
  }, []);

  const pairDrinkPrice = pairDrink ? getMinDrinkPrice(pairDrink) : 0;
  const pairTotal = (pairFood?.price ?? 0) + pairDrinkPrice;

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#E2E6E3] pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-[#57605B]">
            <span>COFFEE SMITR</span>
            <span aria-hidden="true">·</span>
            <span>Daily Brew &amp; Fresh Bake</span>
            <span aria-hidden="true">·</span>
            <span>ราคาดังกล่าวยังรวม VAT แล้ว</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#161B18] [text-wrap:balance]">
            รายการเมนูอาหารและเครื่องดื่ม งบไม่เกิน {BUDGET_LIMIT_BAHT} บาท
          </h2>
          <p className="text-sm text-[#57605B]">
            สำรวจราคาอาหาร (60–88 บาท) และเครื่องดื่ม (50–90 บาท) พร้อมทดลองจับคู่เซตไม่เกิน 150 บาท แล้วกดส่งเข้าแบบสำรวจได้ทันที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EAECEB] rounded-lg shrink-0">
          {[
            { id: 'combos', label: 'เซตจับคู่ ≤ 150฿' },
            { id: 'all', label: 'เมนูทั้งหมด' },
            { id: 'food', label: 'เฉพาะอาหาร (24)' },
            { id: 'drink', label: 'เฉพาะเครื่องดื่ม (43)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id ? 'bg-white text-[#161B18] shadow-xs' : 'text-[#57605B] hover:text-[#161B18]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Curated Combos & Pair Checker */}
      {activeTab === 'combos' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {curatedCombos.map((combo) => (
              <div
                key={combo.title}
                className="bg-white border border-[#E2E6E3] rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-[#1B5E3F]/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#57605B]">
                    <span>{combo.tag}</span>
                    <span className="font-mono tabular-nums font-semibold text-[#1B5E3F]">
                      {combo.total} บาท
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#161B18] leading-snug">{combo.title}</h3>
                  <div className="space-y-1.5 text-xs text-[#57605B] border-t border-[#F0F2F0] pt-3">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{combo.food.nameTh}</span>
                      <span className="font-mono tabular-nums shrink-0">{combo.food.price}฿</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="truncate">
                        {combo.drink.nameTh} ({combo.temp})
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {combo.temp === 'ICE' ? combo.drink.icePrice : combo.drink.hotPrice}฿
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onApplyToSurvey({
                      foodId: combo.food.id,
                      foodName: `${combo.food.nameEn} (${combo.food.nameTh})`,
                      foodPrice: combo.food.price,
                      drinkId: combo.drink.id,
                      drinkName: `${combo.drink.name} (${combo.drink.nameTh})`,
                      drinkTemp: combo.temp,
                      drinkBasePrice:
                        (combo.temp === 'ICE' ? combo.drink.icePrice : combo.drink.hotPrice) ?? 0,
                      drinkAddons: [],
                      drinkAddonsPrice: 0,
                      totalPrice: combo.total,
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors whitespace-nowrap"
                >
                  <span>เลือกเซตนี้ในแบบสำรวจ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Interactive Budget Compatibility Matrix */}
          <div className="bg-white border border-[#E2E6E3] rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF1EE] pb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#161B18] inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1B5E3F]" />
                  ทดลองคำนวณจับคู่เมนูด้วยตนเอง (งบ 150 บาท)
                </h3>
                <p className="text-xs text-[#57605B] mt-0.5">
                  เลือกอาหารและเครื่องดื่มด้านล่างเพื่อเช็คว่ายอดรวมผ่านงบ 150 บาทหรือไม่
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-lg font-semibold text-[#161B18]">
                  รวม {pairTotal} / 150 บาท
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    pairTotal <= BUDGET_LIMIT_BAHT ? 'text-[#1B5E3F]' : 'text-red-700'
                  }`}
                >
                  {pairTotal <= BUDGET_LIMIT_BAHT ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> ผ่านงบ
                    </>
                  ) : (
                    <>เกินงบ +{pairTotal - BUDGET_LIMIT_BAHT}฿</>
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#57605B] mb-1.5">เลือกเมนูอาหาร</label>
                <select
                  value={pairFood?.id ?? ''}
                  onChange={(e) => setPairFood(FOOD_MENU_ITEMS.find((f) => f.id === e.target.value) ?? null)}
                  className="w-full px-3 py-2.5 text-sm bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
                >
                  {FOOD_MENU_ITEMS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nameTh} ({f.category}) — {f.price} บาท
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57605B] mb-1.5">เลือกเครื่องดื่ม</label>
                <select
                  value={pairDrink?.id ?? ''}
                  onChange={(e) => setPairDrink(DRINK_MENU_ITEMS.find((d) => d.id === e.target.value) ?? null)}
                  className="w-full px-3 py-2.5 text-sm bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
                >
                  {DRINK_MENU_ITEMS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameTh} ({d.category}) — {getMinDrinkPrice(d)} บาท
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={pairTotal > BUDGET_LIMIT_BAHT}
                onClick={() => {
                  if (!pairFood || !pairDrink) return;
                  const temp: 'ICE' | 'HOT' = pairDrink.icePrice !== null ? 'ICE' : 'HOT';
                  const basePrice =
                    temp === 'ICE' ? (pairDrink.icePrice ?? 0) : (pairDrink.hotPrice ?? 0);
                  onApplyToSurvey({
                    foodId: pairFood.id,
                    foodName: `${pairFood.nameEn} (${pairFood.nameTh})`,
                    foodPrice: pairFood.price,
                    drinkId: pairDrink.id,
                    drinkName: `${pairDrink.name} (${pairDrink.nameTh})`,
                    drinkTemp: temp,
                    drinkBasePrice: basePrice,
                    drinkAddons: [],
                    drinkAddonsPrice: 0,
                    totalPrice: pairFood.price + basePrice,
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>ส่งชุดนี้ไปยังหน้าแบบสำรวจ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar for Catalog Views */}
      {activeTab !== 'combos' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white border border-[#E2E6E3] rounded-xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#57605B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อเมนู ส่วนผสม หรือเครื่องดื่ม..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2 text-[#57605B]">
                <span>ราคาต่อเมนูไม่เกิน:</span>
                <select
                  value={maxItemPrice}
                  onChange={(e) => setMaxItemPrice(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg text-[#161B18] font-mono tabular-nums"
                >
                  <option value={90}>90 บาท (ทั้งหมด)</option>
                  <option value={75}>75 บาท</option>
                  <option value={65}>65 บาท</option>
                </select>
              </label>
            </div>
          </div>

          {/* Food Section */}
          {(activeTab === 'all' || activeTab === 'food') && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[#161B18] inline-flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#1B5E3F]" />
                  เมนูอาหาร — Panini &amp; Bun, Wrap, Cake ({filteredFoods.length})
                </h3>
                <div className="flex gap-1 p-1 bg-[#EAECEB] rounded-lg self-start">
                  {(['ALL', 'Panini & Bun', 'Wrap', 'Cake'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedFoodFilter(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        selectedFoodFilter === cat ? 'bg-white text-[#161B18] shadow-xs' : 'text-[#57605B]'
                      }`}
                    >
                      {cat === 'ALL' ? 'ทั้งหมด' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFoods.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E2E6E3] rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#57605B]">
                        <span>{item.category}</span>
                        <span className="font-mono tabular-nums text-sm font-semibold text-[#161B18]">
                          {item.price} บาท
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#161B18] mt-1">{item.nameTh}</h4>
                      <div className="text-xs text-[#57605B]">{item.nameEn}</div>
                      <p className="text-xs text-[#57605B] mt-2 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#F0F2F0] text-xs">
                      <span className="text-[#57605B]">
                        เหลืองบเครื่องดื่ม{' '}
                        <strong className="font-mono tabular-nums text-[#1B5E3F]">
                          {BUDGET_LIMIT_BAHT - item.price}฿
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onApplyToSurvey({
                            foodId: item.id,
                            foodName: `${item.nameEn} (${item.nameTh})`,
                            foodPrice: item.price,
                          })
                        }
                        className="font-medium text-[#1B5E3F] hover:underline whitespace-nowrap shrink-0"
                      >
                        เลือกเข้าแบบสำรวจ →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Drinks Section */}
          {(activeTab === 'all' || activeTab === 'drink') && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[#161B18] inline-flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#1B5E3F]" />
                  เมนูเครื่องดื่ม — Coffee, Tea &amp; Non-Coffee, Milk &amp; Soda ({filteredDrinks.length})
                </h3>
                <div className="flex gap-1 p-1 bg-[#EAECEB] rounded-lg self-start">
                  {(['ALL', 'Coffee', 'Tea & Non-Coffee', 'Milk & Soda'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedDrinkFilter(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        selectedDrinkFilter === cat ? 'bg-white text-[#161B18] shadow-xs' : 'text-[#57605B]'
                      }`}
                    >
                      {cat === 'ALL' ? 'ทั้งหมด' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E2E6E3] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E6E3] bg-[#F7F8F7] text-xs font-medium text-[#57605B]">
                      <th className="py-2.5 px-4">หมวดหมู่</th>
                      <th className="py-2.5 px-4">รายการเครื่องดื่ม</th>
                      <th className="py-2.5 px-4 text-right">เย็น (ICE)</th>
                      <th className="py-2.5 px-4 text-right">ร้อน (HOT)</th>
                      <th className="py-2.5 px-4 text-right">เลือกใช้</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1EE] text-sm">
                    {filteredDrinks.map((drink) => (
                      <tr key={drink.id} className="hover:bg-[#F7F8F7]/60 transition-colors">
                        <td className="py-2.5 px-4 text-xs text-[#57605B] whitespace-nowrap">{drink.category}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-[#161B18]">{drink.nameTh}</div>
                          <div className="text-xs text-[#57605B]">{drink.name}</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#161B18]">
                          {drink.icePrice !== null ? `${drink.icePrice}฿` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#161B18]">
                          {drink.hotPrice !== null ? `${drink.hotPrice}฿` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const temp: 'ICE' | 'HOT' = drink.icePrice !== null ? 'ICE' : 'HOT';
                              const base =
                                temp === 'ICE' ? (drink.icePrice ?? 0) : (drink.hotPrice ?? 0);
                              onApplyToSurvey({
                                drinkId: drink.id,
                                drinkName: `${drink.name} (${drink.nameTh})`,
                                drinkTemp: temp,
                                drinkBasePrice: base,
                                drinkAddons: [],
                                drinkAddonsPrice: 0,
                              });
                            }}
                            className="text-xs font-medium text-[#1B5E3F] hover:underline"
                          >
                            เลือกเมนูนี้ →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-[#57605B] flex flex-wrap gap-x-6 gap-y-1 px-1">
                <span>ตัวเลือกเพิ่มเติม (Option):</span>
                {DRINK_ADDONS.map((a) => (
                  <span key={a.id} className="font-mono tabular-nums">
                    {a.label} +{a.price}฿
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
