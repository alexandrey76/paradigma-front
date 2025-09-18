const PUB = process.env.PUBLIC_URL || "";

const products = [
  {
    id: 1,
    name: "Товар 1",
    description: `Набор:
Новая модель                                 с защитными системами
Прочный кейс
Щипцы
2 чаши
Набор очистки
Инструкция`,
    price: 1000,
    images: [
      PUB + "/products_images/product1_1.jpg",
      PUB + "/products_images/product1_2.jpg",
      PUB + "/products_images/product1_3.jpg"
    ],
    videos: [PUB + "/videos/product1-1_new.mp4"]
  },
  {
    id: 2,
    name: "Товар 2",
    description: "Описание товара 2",
    price: 1000,
    images: []
  },
  {
    id: 2,
    name: "Товар 2",
    description: "Описание товара 2",
    price: 1000,
    images: []
  },
  {
    id: 2,
    name: "Товар 2",
    description: "Описание товара 2",
    price: 1000,
    images: []
  },

  
];

export default products;
