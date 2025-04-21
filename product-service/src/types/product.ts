export interface Product {
    id?: string;
    title: string;
    description: string;
    price: number;
    image: string;
  }

export interface ProductRequest extends Product {
  count: number;
}
  