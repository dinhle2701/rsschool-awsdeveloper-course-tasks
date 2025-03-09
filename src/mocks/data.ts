import { OrderStatus } from "~/constants/order";
import { CartItem } from "~/models/CartItem";
import { Order } from "~/models/Order";
import { AvailableProduct, Product } from "~/models/Product";

export const products: Product[] = [
  {
    id: "1",
    title: "Ford Mustang Shelby GT500",
    description: "Siêu xe cơ bắp Mỹ với động cơ V8 tăng áp mạnh mẽ.",
    price: 127989.99,
  },
  {
    id: "2",
    title: "Audi R8 V10",
    description: "Siêu xe thể thao với động cơ V10 và khả năng tăng tốc ấn tượng.",
    price: 157866.99,
  },
  {
    id: "3",
    title: "BMW M3 Edition",
    description: "Mẫu sedan hiệu suất cao với thiết kế thể thao và công nghệ tiên tiến.",
    price: 87000.99,
  },
  {
    id: "4",
    title: "Ford Mustang Shelby GT350",
    description: "Phiên bản nâng cấp của Mustang với hệ thống treo thể thao.",
    price: 92000.99,
  },
  {
    id: "5",
    title: "Lamborghini Huracan EVO",
    description: "Siêu xe Ý với động cơ V10 và thiết kế khí động học tối ưu.",
    price: 210000.99,
  },
  {
    id: "6",
    title: "Porsche 911 Turbo S",
    description: "Mẫu xe thể thao huyền thoại với công suất mạnh mẽ và khả năng xử lý xuất sắc.",
    price: 205000.99,
  },
  {
    id: "7",
    title: "Mercedes-AMG GT R",
    description: "Xe thể thao hiệu suất cao với động cơ V8 Biturbo.",
    price: 162000.99,
  },
  {
    id: "8",
    title: "McLaren 720S",
    description: "Siêu xe Anh Quốc với thiết kế hiện đại và công nghệ tiên tiến.",
    price: 299000.99,
  },
  {
    id: "9",
    title: "Chevrolet Corvette C8",
    description: "Xe thể thao động cơ đặt giữa với hiệu suất vượt trội.",
    price: 70000.99,
  },
  {
    id: "10",
    title: "Ferrari F8 Tributo",
    description: "Siêu xe của Ferrari với động cơ V8 mạnh mẽ và thiết kế đẳng cấp.",
    price: 280000.99,
  },
  {
    id: "11",
    title: "Tesla Model S Plaid",
    description: "Xe điện nhanh nhất thế giới với chế độ Plaid mạnh mẽ.",
    price: 135990.99,
  },
  {
    id: "12",
    title: "Bugatti Chiron Super Sport",
    description: "Siêu xe tốc độ với động cơ W16 quad-turbo.",
    price: 3900000.99,
  },
  {
    id: "13",
    title: "Nissan GT-R Nismo",
    description: "Chiếc xe huyền thoại của Nhật Bản với hiệu suất cực cao.",
    price: 210000.99,
  },
  {
    id: "14",
    title: "Aston Martin DB11",
    description: "Xe thể thao sang trọng của Anh với động cơ V12 mạnh mẽ.",
    price: 205000.99,
  },
  {
    id: "15",
    title: "Koenigsegg Jesko",
    description: "Siêu xe hypercar với công suất hơn 1600 mã lực.",
    price: 3200000.99,
  },
  {
    id: "16",
    title: "Lexus LFA",
    description: "Siêu xe Nhật Bản với động cơ V10 âm thanh cực chất.",
    price: 550000.99,
  },
  {
    id: "17",
    title: "Pagani Huayra",
    description: "Hypercar với thiết kế nghệ thuật và động cơ V12.",
    price: 2500000.99,
  },
  {
    id: "18",
    title: "Rolls-Royce Phantom",
    description: "Xe siêu sang với nội thất xa hoa và công nghệ đỉnh cao.",
    price: 450000.99,
  },
  {
    id: "19",
    title: "Lamborghini Aventador SVJ",
    description: "Siêu xe với thiết kế hầm hố và hiệu suất cực đại.",
    price: 515000.99,
  },
  {
    id: "20",
    title: "Porsche Taycan Turbo S",
    description: "Xe điện hiệu suất cao với khả năng tăng tốc nhanh chóng.",
    price: 185000.99,
  },
  {
    id: "21",
    title: "VR Headset",
    description:
      "Immersive VR headset with motion tracking and high-resolution display.",
    price: 299.99,
  },
  {
    id: "22",
    title: "Portable Projector",
    description:
      "Compact projector with 1080p resolution and built-in speakers.",
    price: 249.99,
  },
  {
    id: "23",
    title: "Smartwatch",
    description:
      "Fitness smartwatch with GPS, heart rate monitor, and smartphone notifications.",
    price: 199.99,
  },
  {
    id: "24",
    title: "Noise-Canceling Headphones",
    description:
      "Over-ear headphones with active noise cancellation and 30-hour battery life.",
    price: 349.99,
  },
  {
    id: "25",
    title: "USB Flash Drive",
    description: "128GB USB flash drive with fast data transfer speeds.",
    price: 24.99,
  },
  {
    id: "26",
    title: "Gaming Console",
    description:
      "Next-gen gaming console with 4K gaming and streaming capabilities.",
    price: 499.99,
  },
  {
    id: "27",
    title: "Smart Home Hub",
    description:
      "Central hub for controlling smart home devices with voice commands.",
    price: 129.99,
  },
  {
    id: "28",
    title: "Drone",
    description: "Compact drone with 4K camera and stable flight controls.",
    price: 299.99,
  },
  {
    id: "29",
    title: "E-Reader",
    description:
      "Lightweight e-reader with glare-free display and weeks-long battery life.",
    price: 129.99,
  },
  {
    id: "30",
    title: "Webcam",
    description:
      "1080p webcam with autofocus and built-in microphone for video calls.",
    price: 59.99,
  },
  {
    id: "31",
    title: "Power Bank",
    description: "20000mAh power bank with fast charging and dual USB ports.",
    price: 39.99,
  },
  {
    id: "32",
    title: "Smart Plug",
    description:
      "Wi-Fi-enabled smart plug for remote control of home appliances.",
    price: 19.99,
  },
  {
    id: "33",
    title: "Gaming Monitor",
    description:
      "27-inch gaming monitor with 144Hz refresh rate and G-Sync technology.",
    price: 349.99,
  },
  {
    id: "34",
    title: "Wireless Charger",
    description:
      "Fast wireless charger compatible with smartphones and earbuds.",
    price: 29.99,
  },
  {
    id: "35",
    title: "Bluetooth Keyboard",
    description:
      "Slim Bluetooth keyboard with long battery life for tablets and smartphones.",
    price: 49.99,
  },
  {
    id: "36",
    title: "Home Security Camera",
    description:
      "1080p security camera with night vision and motion detection.",
    price: 89.99,
  },
  {
    id: "37",
    title: "External DVD Drive",
    description:
      "Portable DVD drive for laptops and desktops with USB connectivity.",
    price: 34.99,
  },
  {
    id: "38",
    title: "Smart Scale",
    description:
      "Digital smart scale with body composition analysis and app integration.",
    price: 49.99,
  },
  {
    id: "39",
    title: "USB Microphone",
    description:
      "Studio-quality USB microphone for streaming, podcasting, and recording.",
    price: 99.99,
  },
  {
    id: "40",
    title: "Gaming Mouse Pad",
    description:
      "Large gaming mouse pad with non-slip base and smooth surface.",
    price: 19.99,
  },
  {
    id: "41",
    title: "Portable Scanner",
    description:
      "Handheld scanner for documents and photos with wireless connectivity.",
    price: 129.99,
  },
  {
    id: "42",
    title: "Smart Doorbell",
    description: "Video doorbell with motion detection and two-way audio.",
    price: 199.99,
  },
  {
    id: "43",
    title: "Wireless Headset",
    description:
      "Comfortable wireless headset with noise-canceling microphone.",
    price: 79.99,
  },
  {
    id: "44",
    title: "Mini PC",
    description:
      "Compact mini PC with powerful performance for home and office use.",
    price: 399.99,
  },
  {
    id: "45",
    title: "Digital Photo Frame",
    description:
      "10-inch digital photo frame with Wi-Fi and cloud storage support.",
    price: 99.99,
  },
  {
    id: "46",
    title: "Car Charger",
    description:
      "Dual-port car charger with fast charging for smartphones and tablets.",
    price: 14.99,
  },
  {
    id: "47",
    title: "Bluetooth Adapter",
    description:
      "Compact Bluetooth adapter for adding wireless audio to any device.",
    price: 9.99,
  },
  {
    id: "48",
    title: "HDMI Cable",
    description: "High-speed HDMI cable for 4K video and audio transmission.",
    price: 12.99,
  },
  {
    id: "49",
    title: "Laptop Stand",
    description:
      "Adjustable laptop stand for ergonomic positioning and better airflow.",
    price: 29.99,
  },
  {
    id: "50",
    title: "Surge Protector",
    description:
      "6-outlet surge protector with USB charging ports and safety features.",
    price: 24.99,
  },
];

export const availableProducts: AvailableProduct[] = products.map(
  (product, index) => ({ ...product, count: index + 1 })
);

export const cart: CartItem[] = [
  {
    product: {
      description: "Short Product Description1",
      id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
      price: 24,
      title: "ProductOne",
    },
    count: 2,
  },
  {
    product: {
      description: "Short Product Description7",
      id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
      price: 15,
      title: "ProductName",
    },
    count: 5,
  },
];

export const orders: Order[] = [
  {
    id: "1",
    address: {
      address: "some address",
      firstName: "Name",
      lastName: "Surname",
      comment: "",
    },
    items: [
      { productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa", count: 2 },
      { productId: "7567ec4b-b10c-45c5-9345-fc73c48a80a1", count: 5 },
    ],
    statusHistory: [
      { status: OrderStatus.Open, timestamp: Date.now(), comment: "New order" },
    ],
  },
  {
    id: "2",
    address: {
      address: "another address",
      firstName: "John",
      lastName: "Doe",
      comment: "Ship fast!",
    },
    items: [{ productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa", count: 3 }],
    statusHistory: [
      {
        status: OrderStatus.Sent,
        timestamp: Date.now(),
        comment: "Fancy order",
      },
    ],
  },
];
