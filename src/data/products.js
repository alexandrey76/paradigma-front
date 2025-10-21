const PUB = process.env.PUBLIC_URL || "";

const products = [
  {
    id: 1,
    name: "Paradigma ONE",
    description: "Paradigma One — инновационный электронный кальян без угля и пепла. Удобен в использовании, безопасен для помещений и техники, стильно впишется в любую обстановку.",
    configuration:
    `
    Комплектация:
    •   Электронный кальян Paradigma One
    •   Прочный кейс
    •   Щипцы
    •   2 чаши
    •   Набор для очистки
    •   Зарядное устройство
    •   Инструкция
    `,
    price: 19900,
    images: [
      PUB + "/products_images/ParadigmaOne.jpg",
      PUB + "/products_images/ParadigmaOne2.jpg",
      PUB + "/products_images/ParadigmaOne3.jpg",
      PUB + "/products_images/ParadigmaOne4.jpg"
    ]
  },



  {
    id: 2,
    name: "Paradigma X Lukah",
    description: "Paradigma X Lukah — стильная премиальная модель с технологичным управлением и особым дизайном. Съёмный аккумулятор и удобная комплектация обеспечат свободу использования где угодно.",
    configuration:
    `
    Комплектация:
    •   Электронный кальян Paradigma X Lukah
    •   Прочная коробка-кейс
    •   Аккумулятор (съёмный)
    •   Щипцы
    •   1 чаша (стекло)
    •   Набор для очистки
    •   Зарядное устройство 
    •   Инструкция
    `,
    price: 46500,
    images: [
      PUB + "/products_images/ParadigmaLukah.jpg",
      PUB + "/products_images/ParadigmaLukah2.jpg",
      PUB + "/products_images/ParadigmaLukah3.jpg"
    ]
  },

  {
    id: 3,
    name: "Paradigma NEO",
    description: "Paradigma NEO — современный электронный кальян с минималистичным дизайном и съёмным аккумулятором. Лёгкий в использовании, удобен для дома, вечеринок и заведений.",
    configuration:
    `
    Комплектация:
    •   Электронный кальян Paradigma NEO
    •   Прочный кейс для хранения и переноски
    •   Съёмный аккумулятор
    •   2 чаши
    •   Щипцы
    •   Набор для очистки
    •   Зарядное устройство
    •   Инструкция
    `,
    price: 26900,
    images: [
      PUB + "/products_images/ParadigmaNeo.jpg",
      PUB + "/products_images/ParadigmaNeo2.jpg",
      PUB + "/products_images/ParadigmaNeo3.jpg"
    ]
  },

  {
    id: 4,
    name: "Paradigma Portative",
    description: "Paradigma Portative — мобильный кальян нового поколения. Компактный корпус делают его идеальным спутником в поездках, на отдыхе и в машине.",
    configuration:
    `
    Комплектация:
    •   Электронный кальян Paradigma Portative
    •   Кейс для хранения и переноски
    •   Чаша (1 шт.)
    •   Шланг
    •   Зарядное устройство
    •   Инструкция
    `,
    price: 18500,
    images: [
      PUB + "/products_images/ParadigmaPortative.jpg",
      PUB + "/products_images/ParadigmaPortative2.jpg",
      PUB + "/products_images/ParadigmaPortative3.jpg"
    ]
  }

  
];

export default products;
