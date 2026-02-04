const PUB = process.env.PUBLIC_URL || "";
const P = `${PUB}/assets/products_images`;

const products = [
  {
    id: 1,
    name: "Paradigma ONE Black",
    description:
      "Paradigma One — инновационный электронный кальян без угля и пепла. Удобен в использовании, безопасен для помещений и техники, стильно впишется в любую обстановку.",
    configuration: `
• Электронный кальян Paradigma One
• Прочный кейс
• Щипцы
• 2 чаши
• Набор для очистки
• Зарядное устройство
• Инструкция
`,
    price: 21900,
    status: "preorder",
    inStock: true,
    color: { name: "Черный", hex: "#000000" },
    variantIds: [1, 2],
    images: [
      `${P}/paradigmaone.jpg`,
      `${P}/paradigmaone2.jpg`,
      `${P}/paradigmaone3.jpg`,
      `${P}/paradigmaone4.jpg`,
    ],

    // ✅ доставка: вес/габариты одной позиции
    weightGrams: 4000,
    dimensionsCm: { length: 40, width: 35, height: 28 },
  },
    {
    id: 2,
    name: "Paradigma ONE White",
    description:
      "Paradigma One — инновационный электронный кальян без угля и пепла. Удобен в использовании, безопасен для помещений и техники, стильно впишется в любую обстановку.",
    configuration: `
• Электронный кальян Paradigma One
• Прочный кейс
• Щипцы
• 2 чаши
• Набор для очистки
• Зарядное устройство
• Инструкция
`,
    price: 21900,
    inStock: true,
    color: { name: "Белый", hex: "#ffffffff" },
    variantIds: [1, 2],
    images: [
      `${P}/paradigmaonewhite.jpg`,
      `${P}/paradigmaonewhite2.jpg`,
      `${P}/paradigmaonewhite3.jpg`
    ],

    // ✅ доставка
    weightGrams: 4000,
    dimensionsCm: { length: 40, width: 35, height: 28 },
  },

  {
    id: 5,
    name: "Paradigma X Lukah",
    description:
      "Paradigma X Lukah — стильная премиальная модель с технологичным управлением и особым дизайном. Съёмный аккумулятор и удобная комплектация обеспечат свободу использования где угодно.",
    configuration: `
• Электронный кальян Paradigma X Lukah
• Прочная коробка-кейс
• Аккумулятор (съёмный)
• Щипцы
• 1 чаша (стекло)
• Набор для очистки
• Зарядное устройство
• Инструкция
`,
    price: 46500,
    oldPrice: null,
    inStock: true,
    status: "preorder",
    images: [
      `${P}/paradigmalukah.jpg`,
      `${P}/paradigmalukah2.jpg`,
      `${P}/paradigmalukah3.jpg`,
    ],

    // ✅ доставка
    weightGrams: 6000,
    dimensionsCm: { length: 69, width: 39, height: 42 },
  },

  {
    id: 3,
    name: "Paradigma NEO",
    description:
      "Paradigma NEO — современный электронный кальян с минималистичным дизайном и съёмным аккумулятором. Лёгкий в использовании, удобен для дома, вечеринок и заведений.",
    configuration: `
• Электронный кальян Paradigma NEO
• Прочный кейс для хранения и переноски
• Съёмный аккумулятор
• 2 чаши
• Щипцы
• Набор для очистки
• Зарядное устройство
• Инструкция
`,
    price: 26900,
    oldPrice: 29590,
    inStock: true,
    status: "preorder",
    images: [
      `${P}/paradigmaneo.jpg`,
      `${P}/paradigmaneo2.jpg`,
      `${P}/paradigmaneo3.jpg`,
    ],

    // ✅ доставка
    weightGrams: 4200,
    dimensionsCm: { length: 40, width: 35, height: 28 },
  },

  {
    id: 4,
    name: "Paradigma Portative",
    description:
      "Paradigma Portative — мобильный кальян нового поколения. Компактный корпус делают его идеальным спутником в поездках, на отдыхе и в машине.",
    configuration: `
  • Электронный кальян Paradigma Portative
  • Кейс для хранения и переноски
  • Чаша (1 шт.)
  • Шланг
  • Зарядное устройство
  • Инструкция
  `,
    price: 18500,
    inStock: false,
    images: [
      `${P}/paradigmaportative.jpg`,
      `${P}/paradigmaportative2.jpg`,
      `${P}/paradigmaportative3.jpg`,
    ],

    // ✅ доставка
    weightGrams: 1900,
    dimensionsCm: { length: 32, width: 16, height: 12 },
  },


];

export default products;
