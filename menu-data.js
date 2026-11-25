// عدّل أسماء وأسعار وصور الأصناف هنا.
// image: اسم ملف الصورة الموجود داخل assets/images، أو null عند عدم توفرها.
window.MENU_DATA = [
  {
    id: "cold",
    name: "مشروبات باردة",
    shortName: "الباردة",
    english: "ICED DRINKS",
    icon: "cold",
    items: [
      { name: "قهوة اليوم", price: 5, image: "iced-coffee-day.webp" },
      { name: "قهوة V60", price: 12, image: null },
      { name: "أمريكانو", price: 12, image: "iced-americano.webp" },
      { name: "اسبريسو فريدو", price: 12, image: null },
      { name: "سبانش لاتيه", price: 14, image: null },
      { name: "كراميل لاتيه", price: 16, image: "caramel-latte.webp" },
      { name: "ماتشا", price: 16, image: null },
      { name: "موكا", price: 14, image: "iced-mocha.webp" },
      { name: "كركديه", price: 7, image: null }
    ]
  },
  {
    id: "hot",
    name: "مشروبات ساخنة",
    shortName: "الساخنة",
    english: "HOT DRINKS",
    icon: "hot",
    items: [
      { name: "قهوة اليوم", price: 5, image: "hot-coffee-day.webp" },
      { name: "قهوة V60", price: 19, image: null },
      { name: "أمريكانو", price: 12, image: null },
      { name: "لاتيه", price: 13, image: "latte.webp" },
      { name: "كورتادو", price: 11, image: null },
      { name: "كابتشينو", price: 13, image: null },
      { name: "فلات وايت", price: 10, image: null },
      { name: "اسبريسو", price: 9, image: "espresso.webp" },
      { name: "موكا", price: 13, image: null },
      { name: "هوت شوكليت", price: 12, image: "hot-chocolate.webp" }
    ]
  },
  {
    id: "sweets",
    name: "مخبوزات وحلى",
    shortName: "المخبوزات والحلى",
    english: "BAKERY & SWEETS",
    icon: "roll",
    items: [
      { name: "وافل", price: 10, image: "waffle.webp" },
      { name: "سينابون كلاسيك", price: 14, image: null },
      { name: "سينابون كراميل", price: 16, image: "cinnamon-caramel.webp" },
      { name: "سينابون تيراميسو", price: 16, image: "cinnamon-tiramisu.webp" },
      { name: "سينابون تفاح", price: 18, image: "cinnamon-apple.webp" },
      { name: "سينابون شوكولاتة", price: 16, image: "cinnamon-chocolate.webp" }
    ]
  },
  {
    id: "extras",
    name: "طلبات جانبية وإضافات",
    shortName: "الإضافات",
    english: "SIDES & EXTRAS",
    icon: "extras",
    items: [
      { name: "كراميل", price: 3, image: null },
      { name: "شوكولاته", price: 3, image: null },
      { name: "بيكان", price: 3, image: null },
      { name: "ايسكريم", price: 5, image: null }
    ]
  }
];
