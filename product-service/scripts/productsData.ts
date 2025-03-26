import { Product } from '../src/types/product';

export const productsData: Omit<Product, 'id'>[] = [
    {
      title: 'Bob Ross Brushes',
      description: "These are special brushes made from natural bristles and shaped according to Bob's very precise specifications.",
      price: 150
    },
    {
      title: 'Canvas Slim Elite 30x30cm',
      description: 'Professional Quality 100% cotton, 300gm weight, acrylic primed and suitable for oil, acrylic and alkyd painters.',
      price: 10
    },
    {
      title: 'Easel Studio A Frame La Palma',
      description: 'Tripod easel model Pine, an economical A-shaped easel, foldable with 3 legs.',
      price: 60
    },
    {
      title: 'Georgian Set 22ml Starter 6pk',
      description: 'A set of six 22ml tubes. An ideal colour range to get started in oil painting.',
      price: 21
    },
    {
      title: 'Palette Mijello XL Ellipse',
      description: 'This palette is comfortable to the hand with its ergonomic design.',
      price: 18
    }
  ];