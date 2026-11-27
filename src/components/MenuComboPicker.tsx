import { useMemo, useState } from 'react';
import { AlertCircle, Check, Coffee, Plus, RotateCcw, Search, Utensils, X } from 'lucide-react';
import {
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

interface MenuComboPickerProps {
  budgetLimit: number;
  value: MenuComboSelection;
  onChange: (next: MenuComboSelection) => void;
}

const EMPTY_COMBO: MenuComboSelection = {
  foodId: null,
  foodName: null,
  foodPrice: 0,
  drinkId: null,
  drinkName: null,
  drinkTemp: null,
  drinkBasePrice: 0,
  drinkAddons: [],
  drinkAddonsPrice: 0,
  totalPrice: 0,
};

interface QuickComboPreset {
  label: string;
  subtitle: string;
  foodId: string;
  drinkId: string;
  temp: 'ICE' | 'HOT';
}

const QUICK_PRESETS: QuickComboPreset[] = [
  {
    label: 'เซตอิ่มคุ้ม 115฿',
    subtitle: 'พานีนี แฮมชีส + อเมริกาโน่เย็น',
    foodId: 'food-ham-cheese-panini',
    drinkId: 'drink-americano',
    temp: 'ICE',
  },
  {
    label: 'เซตยอดนิยม 145฿',
    subtitle: 'พานีนี ทรัฟเฟิลแฮมชีส + มัทฉะอูจิเย็น',
    foodId: 'food-truffle-ham-cheese-panini',
    drinkId: 'drink-matcha-uji',
    temp: 'ICE',
  },
  {
    label: 'เซตสลัดแร็ป 148฿',
    subtitle: 'แร็ปซีซาร์สลัดไก่ + ลาเต้เย็น',
    foodId: 'food-caesar-chicken-wrap',
    drinkId: 'drink-latte',
    temp: 'ICE',
  },
  {
    label: 'เซตปราศจากนม 135฿',
    subtitle: 'บาร์โอ๊ตกล้วยนาน่า + โอ๊ตมิลค์ลาเต้',
    foodId: 'food-nanas-no-worries',
    drinkId: 'drink-oat-milk-latte',
    temp: 'ICE',
  },
];

export function MenuComboPicker({ budgetLimit, value, onChange }: MenuComboPickerProps) {
  const [foodCategory, setFoodCategory] = useState<'ALL' | FoodCategory>('ALL');
  const [drinkCategory, setDrinkCategory] = useState<'ALL' | DrinkCategory>('ALL');
  const [foodQuery, setFoodQuery] = useState('');
  const [drinkQuery, setDrinkQuery] = useState('');
  const [onlyWithinRemaining, setOnlyWithinRemaining] = useState(true);

  const selectedDrink = useMemo(
    () => DRINK_MENU_ITEMS.find((d) => d.id === value.drinkId) ?? null,
    [value.drinkId]
  );

  const drinkTotal = value.drinkBasePrice + value.drinkAddonsPrice;
  const totalPrice = value.foodPrice + drinkTotal;
  const remaining = budgetLimit - totalPrice;
  const isOverBudget = totalPrice > budgetLimit;
  const remainingForFood = budgetLimit - drinkTotal;
  const remainingForDrink = budgetLimit - value.foodPrice;

  const filteredFoods = useMemo(() => {
    const q = foodQuery.trim().toLowerCase();
    return FOOD_MENU_ITEMS.filter((item) => {
      if (foodCategory !== 'ALL' && item.category !== foodCategory) return false;
      if (onlyWithinRemaining && value.drinkId && item.price > remainingForFood && item.id !== value.foodId) {
        return false;
      }
      if (!q) return true;
      return (
        item.nameEn.toLowerCase().includes(q) ||
        item.nameTh.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [foodCategory, foodQuery, onlyWithinRemaining, value.drinkId, value.foodId, remainingForFood]);

  const filteredDrinks = useMemo(() => {
    const q = drinkQuery.trim().toLowerCase();
    return DRINK_MENU_ITEMS.filter((item) => {
      if (drinkCategory !== 'ALL' && item.category !== drinkCategory) return false;
      const minPrice = getMinDrinkPrice(item);
      if (onlyWithinRemaining && value.foodId && minPrice > remainingForDrink && item.id !== value.drinkId) {
        return false;
      }
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.nameTh.toLowerCase().includes(q);
    });
  }, [drinkCategory, drinkQuery, onlyWithinRemaining, value.foodId, value.drinkId, remainingForDrink]);

  function selectFood(item: FoodMenuItem) {
    if (value.foodId === item.id) {
      const nextTotal = drinkTotal;
      onChange({
        ...value,
        foodId: null,
        foodName: null,
        foodPrice: 0,
        totalPrice: nextTotal,
      });
      return;
    }
    const nextTotal = item.price + drinkTotal;
    onChange({
      ...value,
      foodId: item.id,
      foodName: `${item.nameEn} (${item.nameTh})`,
      foodPrice: item.price,
      totalPrice: nextTotal,
    });
  }

  function selectDrink(item: DrinkMenuItem, preferredTemp?: 'ICE' | 'HOT') {
    if (value.drinkId === item.id && !preferredTemp) {
      onChange({
        ...value,
        drinkId: null,
        drinkName: null,
        drinkTemp: null,
        drinkBasePrice: 0,
        drinkAddons: [],
        drinkAddonsPrice: 0,
        totalPrice: value.foodPrice,
      });
      return;
    }

    const temp: 'ICE' | 'HOT' =
      preferredTemp && ((preferredTemp === 'ICE' && item.icePrice !== null) || (preferredTemp === 'HOT' && item.hotPrice !== null))
        ? preferredTemp
        : item.icePrice !== null
          ? 'ICE'
          : 'HOT';

    const basePrice = temp === 'ICE' ? (item.icePrice ?? item.hotPrice ?? 0) : (item.hotPrice ?? item.icePrice ?? 0);
    const keepAddons = value.drinkId === item.id ? value.drinkAddons : [];
    const keepAddonsPrice = value.drinkId === item.id ? value.drinkAddonsPrice : 0;
    const nextTotal = value.foodPrice + basePrice + keepAddonsPrice;

    onChange({
      ...value,
      drinkId: item.id,
      drinkName: `${item.name} (${item.nameTh})`,
      drinkTemp: temp,
      drinkBasePrice: basePrice,
      drinkAddons: keepAddons,
      drinkAddonsPrice: keepAddonsPrice,
      totalPrice: nextTotal,
    });
  }

  function toggleAddon(addonLabel: string, addonPrice: number) {
    if (!value.drinkId) return;
    const exists = value.drinkAddons.includes(addonLabel);
    const nextAddons = exists
      ? value.drinkAddons.filter((a) => a !== addonLabel)
      : [...value.drinkAddons, addonLabel];
    const nextAddonsPrice = exists
      ? Math.max(0, value.drinkAddonsPrice - addonPrice)
      : value.drinkAddonsPrice + addonPrice;
    onChange({
      ...value,
      drinkAddons: nextAddons,
      drinkAddonsPrice: nextAddonsPrice,
      totalPrice: value.foodPrice + value.drinkBasePrice + nextAddonsPrice,
    });
  }

  function applyPreset(preset: QuickComboPreset) {
    const food = FOOD_MENU_ITEMS.find((f) => f.id === preset.foodId);
    const drink = DRINK_MENU_ITEMS.find((d) => d.id === preset.drinkId);
    if (!food || !drink) return;
    const basePrice = preset.temp === 'ICE' ? (drink.icePrice ?? 0) : (drink.hotPrice ?? 0);
    onChange({
      foodId: food.id,
      foodName: `${food.nameEn} (${food.nameTh})`,
      foodPrice: food.price,
      drinkId: drink.id,
      drinkName: `${drink.name} (${drink.nameTh})`,
      drinkTemp: preset.temp,
      drinkBasePrice: basePrice,
      drinkAddons: [],
      drinkAddonsPrice: 0,
      totalPrice: food.price + basePrice,
    });
  }

  const progressPercent = Math.min(100, Math.round((totalPrice / budgetLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Budget Status Summary Bar */}
      <div
        className={`rounded-xl border p-4 sm:p-5 transition-colors ${
          isOverBudget
            ? 'bg-red-50/70 border-red-300'
            : 'bg-[#F7F8F7] border-[#DCE2DD]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#57605B]">
              <span>สรุปชุดเมนูที่เลือก</span>
              <span aria-hidden="true">·</span>
              <span>งบประมาณสูงสุด {budgetLimit} บาท/ท่าน</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#161B18]">
              <span className="inline-flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#1B5E3F]" />
                {value.foodName ? (
                  <span>
                    <strong className="font-semibold">{value.foodName}</strong>{' '}
                    <span className="font-mono tabular-nums text-[#57605B]">({value.foodPrice}฿)</span>
                  </span>
                ) : (
                  <span className="text-[#57605B]">ยังไม่ได้เลือกอาหาร</span>
                )}
              </span>
              <span aria-hidden="true" className="text-[#9CA39E]">+</span>
              <span className="inline-flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-[#1B5E3F]" />
                {value.drinkName ? (
                  <span>
                    <strong className="font-semibold">
                      {value.drinkName} ({value.drinkTemp})
                    </strong>{' '}
                    <span className="font-mono tabular-nums text-[#57605B]">({drinkTotal}฿)</span>
                  </span>
                ) : (
                  <span className="text-[#57605B]">ยังไม่ได้เลือกเครื่องดื่ม</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="font-mono tabular-nums text-xl font-semibold text-[#161B18]">
                {totalPrice} <span className="text-sm font-normal text-[#57605B]">/ {budgetLimit} บาท</span>
              </div>
              {isOverBudget ? (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>เกินงบประมาณ +{Math.abs(remaining)} บาท</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-[#1B5E3F]">
                  <Check className="w-3.5 h-3.5" />
                  <span>อยู่ในงบ (คงเหลือ {remaining} บาท)</span>
                </div>
              )}
            </div>

            {(value.foodId || value.drinkId) && (
              <button
                type="button"
                onClick={() => onChange(EMPTY_COMBO)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#57605B] bg-white border border-[#DCE2DD] rounded-lg hover:text-[#161B18] hover:border-[#BFC7C1] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ล้างที่เลือก
              </button>
            )}
          </div>
        </div>

        {/* Progress Meter */}
        <div className="mt-3 h-2 w-full rounded-full bg-[#E3E7E4] overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              isOverBudget ? 'bg-red-600' : 'bg-[#1B5E3F]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Presets + Budget Filter Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#57605B] mr-1">เซตแนะนำในงบ:</span>
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              title={preset.subtitle}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-[#DCE2DD] rounded-lg text-[#161B18] hover:border-[#1B5E3F] hover:text-[#1B5E3F] transition-colors whitespace-nowrap shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-[#161B18] cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={onlyWithinRemaining}
            onChange={(e) => setOnlyWithinRemaining(e.target.checked)}
            className="w-4 h-4 rounded accent-[#1B5E3F]"
          />
          <span>แสดงเฉพาะเมนูที่รวมแล้วไม่เกิน {budgetLimit} บาท</span>
        </label>
      </div>

      {/* Two-Column Picker: Food (Left) & Beverage (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: FOOD */}
        <div className="bg-white border border-[#E2E6E3] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-[#EEF1EE] pb-3">
            <div>
              <h4 className="text-base font-semibold text-[#161B18]">1. เลือกเมนูอาหาร (60–88 บาท)</h4>
              <p className="text-xs text-[#57605B]">
                {value.drinkId ? `งบอาหารคงเหลือ ${Math.max(0, remainingForFood)} บาท` : 'Panini & Bun · Wrap · Cake'}
              </p>
            </div>
            {value.foodId && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    foodId: null,
                    foodName: null,
                    foodPrice: 0,
                    totalPrice: drinkTotal,
                  })
                }
                className="text-xs font-medium text-[#57605B] hover:text-[#161B18] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" /> ยกเลิกอาหาร
              </button>
            )}
          </div>

          {/* Food Filter Controls */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1 p-1 bg-[#F2F4F2] rounded-lg">
              {(['ALL', 'Panini & Bun', 'Wrap', 'Cake'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFoodCategory(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    foodCategory === cat
                      ? 'bg-white text-[#161B18] shadow-xs'
                      : 'text-[#57605B] hover:text-[#161B18]'
                  }`}
                >
                  {cat === 'ALL' ? 'ทั้งหมด (24)' : cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#57605B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                placeholder="ค้นหาชื่อเมนูอาหาร เช่น แฮมชีส, แซลมอน, แร็ป, บราวนี่..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F8F7] border border-[#E2E6E3] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
              />
            </div>
          </div>

          {/* Food List */}
          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
            {filteredFoods.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#57605B]">
                ไม่พบเมนูอาหารที่อยู่ในงบคงเหลือ {Math.max(0, remainingForFood)} บาท
              </div>
            ) : (
              filteredFoods.map((item) => {
                const isSelected = value.foodId === item.id;
                const wouldExceed = value.drinkId !== null && item.price + drinkTotal > budgetLimit;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectFood(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-[#1B5E3F] bg-[#1B5E3F]/5'
                        : wouldExceed
                          ? 'border-[#ECEFED] bg-[#FAFBFA] opacity-70 hover:opacity-100'
                          : 'border-[#E6EAE7] bg-white hover:border-[#BFC7C1]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#57605B]">
                          <span>{item.category}</span>
                          {item.tags && item.tags.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{item.tags.join(' / ')}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-[#161B18] mt-0.5">{item.nameTh}</div>
                        <div className="text-xs text-[#57605B]">{item.nameEn}</div>
                        <p className="text-xs text-[#57605B] mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono tabular-nums text-sm font-semibold text-[#161B18]">
                          {item.price}฿
                        </span>
                        <div className="mt-1 text-[11px] font-medium">
                          {isSelected ? (
                            <span className="text-[#1B5E3F]">เลือกแล้ว</span>
                          ) : wouldExceed ? (
                            <span className="text-red-700">เกินงบ</span>
                          ) : (
                            <span className="text-[#57605B]">เลือก</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DRINKS */}
        <div className="bg-white border border-[#E2E6E3] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-[#EEF1EE] pb-3">
            <div>
              <h4 className="text-base font-semibold text-[#161B18]">2. เลือกเครื่องดื่ม (50–90 บาท)</h4>
              <p className="text-xs text-[#57605B]">
                {value.foodId ? `งบเครื่องดื่มคงเหลือ ${Math.max(0, remainingForDrink)} บาท` : 'Coffee · Tea & Non-Coffee · Milk & Soda'}
              </p>
            </div>
            {value.drinkId && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    drinkId: null,
                    drinkName: null,
                    drinkTemp: null,
                    drinkBasePrice: 0,
                    drinkAddons: [],
                    drinkAddonsPrice: 0,
                    totalPrice: value.foodPrice,
                  })
                }
                className="text-xs font-medium text-[#57605B] hover:text-[#161B18] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" /> ยกเลิกเครื่องดื่ม
              </button>
            )}
          </div>

          {/* Drink Filter Controls */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1 p-1 bg-[#F2F4F2] rounded-lg">
              {(['ALL', 'Coffee', 'Tea & Non-Coffee', 'Milk & Soda'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDrinkCategory(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    drinkCategory === cat
                      ? 'bg-white text-[#161B18] shadow-xs'
                      : 'text-[#57605B] hover:text-[#161B18]'
                  }`}
                >
                  {cat === 'ALL' ? 'ทั้งหมด (43)' : cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#57605B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={drinkQuery}
                onChange={(e) => setDrinkQuery(e.target.value)}
                placeholder="ค้นหาเครื่องดื่ม เช่น Americano, Matcha, ชาไทย, Yuzu..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F8F7] border border-[#E2E6E3] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
              />
            </div>
          </div>

          {/* Drink List */}
          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
            {filteredDrinks.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#57605B]">
                ไม่พบเครื่องดื่มที่อยู่ในงบคงเหลือ {Math.max(0, remainingForDrink)} บาท
              </div>
            ) : (
              filteredDrinks.map((item) => {
                const isSelected = value.drinkId === item.id;
                const minPrice = getMinDrinkPrice(item);
                const wouldExceed = value.foodId !== null && value.foodPrice + minPrice > budgetLimit;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-[#1B5E3F] bg-[#1B5E3F]/5'
                        : wouldExceed
                          ? 'border-[#ECEFED] bg-[#FAFBFA] opacity-70'
                          : 'border-[#E6EAE7] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#57605B]">
                          <span>{item.category}</span>
                          {item.tags && item.tags.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{item.tags.join(' / ')}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-[#161B18] mt-0.5">{item.nameTh}</div>
                        <div className="text-xs text-[#57605B]">{item.name}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.icePrice !== null && (
                          <button
                            type="button"
                            onClick={() => selectDrink(item, 'ICE')}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors font-mono tabular-nums whitespace-nowrap shrink-0 ${
                              isSelected && value.drinkTemp === 'ICE'
                                ? 'bg-[#1B5E3F] text-white border-[#1B5E3F]'
                                : 'bg-white text-[#161B18] border-[#DCE2DD] hover:border-[#1B5E3F]'
                            }`}
                          >
                            เย็น {item.icePrice}฿
                          </button>
                        )}
                        {item.hotPrice !== null && (
                          <button
                            type="button"
                            onClick={() => selectDrink(item, 'HOT')}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors font-mono tabular-nums whitespace-nowrap shrink-0 ${
                              isSelected && value.drinkTemp === 'HOT'
                                ? 'bg-[#1B5E3F] text-white border-[#1B5E3F]'
                                : 'bg-white text-[#161B18] border-[#DCE2DD] hover:border-[#1B5E3F]'
                            }`}
                          >
                            ร้อน {item.hotPrice}฿
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Add-on Options when this drink is selected */}
                    {isSelected && selectedDrink && (
                      <div className="mt-3 pt-2.5 border-t border-[#DCE2DD] flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[#57605B]">ตัวเลือกเพิ่มเติม (Option):</span>
                        {DRINK_ADDONS.map((addon) => {
                          const addonFullLabel = `${addon.label} (+${addon.price}฿)`;
                          const checked = value.drinkAddons.includes(addonFullLabel);
                          const overWithAddon = !checked && totalPrice + addon.price > budgetLimit;
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => toggleAddon(addonFullLabel, addon.price)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                                checked
                                  ? 'bg-[#1B5E3F] text-white border-[#1B5E3F]'
                                  : overWithAddon
                                    ? 'bg-white text-[#57605B] border-[#E2E6E3] opacity-60'
                                    : 'bg-white text-[#161B18] border-[#DCE2DD] hover:border-[#1B5E3F]'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>{addonFullLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
