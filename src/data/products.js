const PUB = process.env.PUBLIC_URL || "";

const products = [
  {
    id: 1,
    name: "Paradigma One",
    description: `
Новая модель                                 с защитными системами
Прочный кейс
Щипцы
2 чаши
Набор очистки
Инструкция`,
    price: 17990,
    images: [
      PUB + "/products_images/paradigmaOne.jpg",
      PUB + "/products_images/product1_1.jpg",
      PUB + "/products_images/product1_2.jpg",
      PUB + "/products_images/product1_3.jpg"
    ],
    videos: [PUB + "/videos/product1_1.mp4"]
  },
  {
    id: 2,
    name: "Paradigma x Lukah",
    description: "Описание товара 2",
    price: 1000,
    images: [PUB + "/products_images/paradigmaLukah.jpg"]
  },
  {
    id: 3,
    name: "Paradigma 3",
    description: "Описание товара 3",
    price: 1000,
    images: [PUB + "/products_images/paradigma3.jpg"]
  },
  {
    id: 4,
    name: "Paradigma Portable",
    description: "Описание товара 4",
    price: 1000,
    images: [PUB + "/products_images/paradigmaPortable.jpg"]
  },

  
];

export default products;
