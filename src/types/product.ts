export interface Product {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  imageUrl?: string;
  companyId: string;
  createdAt: string;
}